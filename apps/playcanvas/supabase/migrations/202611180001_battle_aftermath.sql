-- Additive, opt-in battle checkpoint. Older runs and their twelve objectives are unchanged.
begin;
create function game_private.guard_battle_checkpoint() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if old.state ? 'battle' then
    if not (old.state->'completed' ? 'goliath.struck') and new.state->'completed' ? 'goliath.struck' then
      new.state:=jsonb_set(new.state,'{battle}',jsonb_build_object('schemaVersion',1,'revision',1,'stage','fallen'));
    end if;
    if new.state->'completed' ? 'victory.witnessed' and new.state#>>'{battle,stage}' is distinct from 'finished' then
      raise exception 'finish_battle_first';
    end if;
  end if;
  return new;
end $$;
revoke all on function game_private.guard_battle_checkpoint() from public,anon,authenticated;
create trigger battle_checkpoint_guard before update of state on game_private.runs
for each row execute function game_private.guard_battle_checkpoint();

create function public.game_battle(p_command uuid,p_run uuid,p_revision integer,p_battle_revision integer,p_action text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid:=game_private.player_id(); p game_private.profiles%rowtype;
  prior game_private.receipts%rowtype; snapshot jsonb; request jsonb; result jsonb;
  wanted text; next_revision integer;
begin
  if p_command is null then raise exception 'command_required'; end if;
  request:=jsonb_build_object('kind','battle','run',p_run,'revision',p_revision,'battleRevision',p_battle_revision,'action',p_action);
  select * into p from game_private.profiles where id=who for update;
  select * into prior from game_private.receipts where user_id=who and command=p_command;
  if found then
    if prior.request<>request then raise exception 'command_reused'; end if;
    return prior.response;
  end if;
  if p.current_run is distinct from p_run then raise exception 'revision_conflict'; end if;
  select r.state into snapshot from game_private.runs r where r.id=p_run and r.user_id=who for update;
  if snapshot is null or (snapshot->>'revision')::integer is distinct from p_revision
    or (snapshot#>>'{battle,revision}')::integer is distinct from p_battle_revision then raise exception 'revision_conflict'; end if;
  if snapshot->>'status'<>'active' then raise exception 'battle_not_active'; end if;
  if p_action='begin' then
    if snapshot ? 'battle' or jsonb_array_length(snapshot->'completed')<>10 then raise exception 'invalid_battle_action'; end if;
    wanted:='combat'; next_revision:=0;
  elsif p_action='take_sword' then
    if not(snapshot->'completed' ? 'goliath.struck') or snapshot#>>'{battle,stage}' is distinct from 'fallen' then raise exception 'invalid_battle_action'; end if;
    wanted:='sword_taken'; next_revision:=2;
  elsif p_action='finish' then
    if not(snapshot->'completed' ? 'goliath.struck') or snapshot#>>'{battle,stage}' is distinct from 'sword_taken' then raise exception 'invalid_battle_action'; end if;
    wanted:='finished'; next_revision:=3;
  else raise exception 'invalid_battle_action'; end if;
  snapshot:=snapshot||jsonb_build_object('battle',jsonb_build_object('schemaVersion',1,'revision',next_revision,'stage',wanted),
    'updatedAt',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
  update game_private.runs set state=snapshot where id=p_run and user_id=who;
  result:=game_private.envelope(who);
  insert into game_private.receipts(user_id,command,request,response) values(who,p_command,request,result);
  return result;
end $$;
revoke all on function public.game_battle(uuid,uuid,integer,integer,text) from public,anon;
grant execute on function public.game_battle(uuid,uuid,integer,integer,text) to authenticated;
notify pgrst,'reload schema';
commit;
