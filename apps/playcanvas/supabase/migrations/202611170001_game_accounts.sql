-- Development migration. Apply only to the identified game project after review.
begin;
create schema if not exists game_private;
revoke all on schema game_private from public, anon;

create table game_private.catalog (
  version text primary key,
  episode text not null,
  objectives text[] not null
);
insert into game_private.catalog values ('m2-outline-1','david-and-goliath',array[
  'valley.surveyed','provisions.delivered','brothers.met','challenge.heard','eliab.answered',
  'saul.audience','armour.inspected','armour.declined','stones.gathered','sling.practised',
  'goliath.struck','victory.witnessed'
]);
create table game_private.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique check(length(clerk_user_id) between 1 and 200),
  display_name text not null default 'Player' check(length(display_name) between 1 and 40),
  revision integer not null default 0 check(revision >= 0),
  settings jsonb not null default '{"schemaVersion":1,"muted":false,"captions":true,"graphics":"balanced","movement":"auto","labels":"wasd","appearance":null}',
  current_run uuid,
  created_at timestamptz not null default now()
);
create table game_private.runs (
  id uuid primary key,
  user_id uuid not null references game_private.profiles(id),
  state jsonb not null,
  created_at timestamptz not null default now()
);
alter table game_private.profiles add constraint current_run_fk foreign key(current_run) references game_private.runs(id);
create index runs_owner on game_private.runs(user_id,created_at desc);
create table game_private.attempts (
  run_id uuid not null references game_private.runs(id),
  attempt integer not null,
  outcome text not null check(outcome in ('defeated','completed')),
  recorded_at timestamptz not null default now(),
  primary key(run_id,attempt)
);
create table game_private.receipts (
  user_id uuid not null references game_private.profiles(id),
  command uuid not null,
  request jsonb not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key(user_id,command)
);
alter table game_private.profiles enable row level security;
alter table game_private.runs enable row level security;
alter table game_private.attempts enable row level security;
alter table game_private.receipts enable row level security;
alter table game_private.catalog enable row level security;
create policy own_profile on game_private.profiles for select to authenticated using(clerk_user_id = (select auth.jwt()->>'sub'));
create policy own_runs on game_private.runs for select to authenticated using(user_id in(select id from game_private.profiles where clerk_user_id=(select auth.jwt()->>'sub')));
create policy own_attempts on game_private.attempts for select to authenticated using(run_id in(select id from game_private.runs));
-- No client writes and no access to receipts/catalog/private helper functions.
grant usage on schema game_private to authenticated;
grant select on game_private.profiles,game_private.runs,game_private.attempts to authenticated;

create function game_private.player_id() returns uuid language plpgsql security definer set search_path='' as $$
declare subject text := auth.jwt()->>'sub'; result uuid;
begin
  if subject is null or length(subject) not between 1 and 200 then raise exception 'authentication_required'; end if;
  insert into game_private.profiles(clerk_user_id) values(subject) on conflict(clerk_user_id) do nothing;
  select id into result from game_private.profiles where clerk_user_id=subject;
  return result;
end $$;
create function game_private.envelope(p_user uuid) returns jsonb language sql stable set search_path='' as $$
  select case when p.current_run is null then null else jsonb_build_object('current',r.state,'history',coalesce((
    select jsonb_agg(h.summary order by h.created_at) from (
      select jsonb_build_object('runId',q.id,'startedAt',q.state->>'startedAt','updatedAt',q.state->>'updatedAt',
        'status','completed','attempt',(q.state->>'attempt')::integer,'defeats',(q.state->>'defeats')::integer) summary,q.created_at
      from game_private.runs q where q.user_id=p_user and q.id<>p.current_run and q.state->>'status'='completed'
      order by q.created_at desc limit 20
    ) h),'[]'::jsonb)) end
  from game_private.profiles p left join game_private.runs r on r.id=p.current_run where p.id=p_user
$$;
create function public.game_dashboard() returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid := game_private.player_id(); result jsonb;
begin
  select jsonb_build_object('id',p.id,'displayName',p.display_name,'revision',p.revision,'settings',p.settings,'episode',game_private.envelope(who))
  into result from game_private.profiles p where p.id=who;
  return result;
end $$;

create function public.game_progress(p_command uuid,p_kind text,p_run uuid,p_revision integer,p_objective text,p_version text)
returns jsonb language plpgsql security definer set search_path='' as $$
<<progress>>
declare
  who uuid := game_private.player_id(); p game_private.profiles%rowtype; c game_private.catalog%rowtype;
  prior game_private.receipts%rowtype; state jsonb; result jsonb; request jsonb;
  run_id uuid; done integer; status text; attempt integer; defeats integer; rev integer;
  stamp text := to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
  if p_command is null then raise exception 'command_required'; end if;
  request := jsonb_build_object('kind',p_kind,'run',p_run,'revision',p_revision,'objective',p_objective,'version',p_version);
  select * into p from game_private.profiles where id=who for update;
  select * into prior from game_private.receipts where user_id=who and command=p_command;
  if found then
    if prior.request<>request then raise exception 'command_reused'; end if;
    return prior.response;
  end if;
  select * into c from game_private.catalog where version=p_version;
  if not found then raise exception 'unsupported_version'; end if;
  if p_kind='start' then
    if p.current_run is not null or p_run is not null or p_revision is not null then raise exception 'revision_conflict'; end if;
  else
    if p.current_run is distinct from p_run then raise exception 'revision_conflict'; end if;
    select r.state into state from game_private.runs r where r.id=p.current_run and r.user_id=who for update;
    if state is null or (state->>'revision')::integer is distinct from p_revision then raise exception 'revision_conflict'; end if;
    if state->>'contentVersion'<>p_version then raise exception 'unsupported_version'; end if;
  end if;
  if p_kind in ('start','replay') then
    if p_kind='replay' and state->>'status'<>'completed' then raise exception 'finish_before_replay'; end if;
    run_id := gen_random_uuid();
    state := jsonb_build_object('schemaVersion',1,'episodeId',c.episode,'contentVersion',c.version,'runId',run_id,
      'revision',0,'completed','[]'::jsonb,'status','active','attempt',1,'defeats',0,'startedAt',stamp,'updatedAt',stamp);
    insert into game_private.runs(id,user_id,state) values(run_id,who,state);
    update game_private.profiles set current_run=run_id where id=who;
  else
    done := jsonb_array_length(state->'completed'); status:=state->>'status';
    attempt:=(state->>'attempt')::integer; defeats:=(state->>'defeats')::integer; rev:=(state->>'revision')::integer;
    if p_kind='objective' then
      if status<>'active' or c.objectives[done+1] is distinct from p_objective then raise exception 'invalid_objective'; end if;
      state:=jsonb_set(state,'{completed}',(state->'completed') || to_jsonb(p_objective));
      if done+1=cardinality(c.objectives) then
        state:=jsonb_set(state,'{status}','"completed"');
        insert into game_private.attempts(run_id,attempt,outcome) values(p_run,attempt,'completed');
      end if;
    elsif p_kind='defeat' then
      if status<>'active' or c.objectives[done+1]<>'goliath.struck' then raise exception 'invalid_defeat'; end if;
      insert into game_private.attempts(run_id,attempt,outcome) values(p_run,attempt,'defeated');
      state:=state || jsonb_build_object('status','defeated','defeats',defeats+1);
    elsif p_kind='retry' then
      if status<>'defeated' or attempt>=100000 then raise exception 'invalid_retry'; end if;
      state:=state || jsonb_build_object('status','active','attempt',attempt+1);
    else raise exception 'invalid_command'; end if;
    state:=state || jsonb_build_object('revision',rev+1,'updatedAt',stamp);
    update game_private.runs r set state=progress.state where r.id=p_run and r.user_id=who;
  end if;
  result:=game_private.envelope(who);
  insert into game_private.receipts(user_id,command,request,response) values(who,p_command,request,result);
  return result;
end $$;

create function public.game_update_account(p_command uuid,p_revision integer,p_name text,p_settings jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid:=game_private.player_id(); p game_private.profiles%rowtype; prior game_private.receipts%rowtype;
  request jsonb; result jsonb; a jsonb:=p_settings->'appearance';
begin
  if p_command is null then raise exception 'command_required'; end if;
  request:=jsonb_build_object('kind','settings','revision',p_revision,'name',p_name,'settings',p_settings);
  select * into p from game_private.profiles where id=who for update;
  select * into prior from game_private.receipts where user_id=who and command=p_command;
  if found then if prior.request<>request then raise exception 'command_reused'; end if; return prior.response; end if;
  if p.revision is distinct from p_revision then raise exception 'settings_conflict'; end if;
  if p_name is null or length(trim(p_name)) not between 1 and 40 or p_name ~ '[[:cntrl:]]' then raise exception 'invalid_name'; end if;
  if p_settings is null or jsonb_typeof(p_settings)<>'object' or not(p_settings ?& array['schemaVersion','muted','captions','graphics','movement','labels','appearance'])
    or (p_settings - array['schemaVersion','muted','captions','graphics','movement','labels','appearance'])<>'{}'::jsonb
    or p_settings->'schemaVersion'<>'1'::jsonb or jsonb_typeof(p_settings->'muted')<>'boolean' or jsonb_typeof(p_settings->'captions')<>'boolean'
    or jsonb_typeof(p_settings->'graphics')<>'string' or jsonb_typeof(p_settings->'movement')<>'string' or jsonb_typeof(p_settings->'labels')<>'string'
    or p_settings->>'graphics' not in ('balanced','low') or p_settings->>'movement' not in ('auto','keys','stick') or p_settings->>'labels' not in ('wasd','arrows')
  then raise exception 'invalid_settings'; end if;
  if a<>'null'::jsonb and (jsonb_typeof(a)<>'object' or not(a ?& array['skin','hairColour','hairStyle','tunic'])
    or (a-array['skin','hairColour','hairStyle','tunic'])<>'{}'::jsonb
    or jsonb_typeof(a->'skin')<>'string' or jsonb_typeof(a->'hairColour')<>'string' or jsonb_typeof(a->'hairStyle')<>'string' or jsonb_typeof(a->'tunic')<>'string'
    or a->>'skin' not in ('golden','warm','deep') or a->>'hairColour' not in ('dark','black','chestnut')
    or a->>'hairStyle' not in ('short','full') or a->>'tunic' not in ('teal','clay','linen')) then raise exception 'invalid_appearance'; end if;
  update game_private.profiles set display_name=trim(p_name),settings=p_settings,revision=revision+1 where id=who;
  result:=public.game_dashboard();
  insert into game_private.receipts(user_id,command,request,response) values(who,p_command,request,result);
  return result;
end $$;

create function public.game_attempt_history(p_offset integer default 0) returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid:=game_private.player_id(); result jsonb;
begin
  if p_offset<0 or p_offset>100000 then raise exception 'invalid_offset'; end if;
  select coalesce(jsonb_agg(to_jsonb(h)),'[]'::jsonb) into result from (
    select a.run_id,a.attempt,a.outcome,a.recorded_at from game_private.attempts a join game_private.runs r on r.id=a.run_id
    where r.user_id=who order by a.recorded_at desc limit 20 offset p_offset
  ) h;
  return result;
end $$;
revoke all on all tables in schema game_private from public,anon;
revoke all on all functions in schema game_private from public,anon,authenticated;
revoke all on function public.game_dashboard(),public.game_progress(uuid,text,uuid,integer,text,text),public.game_update_account(uuid,integer,text,jsonb),public.game_attempt_history(integer) from public,anon;
grant execute on function public.game_dashboard(),public.game_progress(uuid,text,uuid,integer,text,text),public.game_update_account(uuid,integer,text,jsonb),public.game_attempt_history(integer) to authenticated;
commit;
