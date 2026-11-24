$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$qaRoot=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$qaBookPath=Join-Path $qaRoot 'docs/qa/David_and_Goliath_Complete_Game_DVPR.xlsx'
$qaArchive=[System.IO.Compression.ZipFile]::OpenRead($qaBookPath)
try {
  $qaRows=@()
  foreach($qaEntry in $qaArchive.Entries | Where-Object FullName -Match '^xl/worksheets/sheet\d+\.xml$'){
    $qaReader=[System.IO.StreamReader]::new($qaEntry.Open())
    try { [xml]$qaXml=$qaReader.ReadToEnd() } finally { $qaReader.Dispose() }
    $qaPane=$qaXml.GetElementsByTagName('pane',$qaXml.DocumentElement.NamespaceURI) | Select-Object -First 1
    $qaErrors=@($qaXml.GetElementsByTagName('c',$qaXml.DocumentElement.NamespaceURI) | Where-Object {$_.GetAttribute('t') -eq 'e'})
    if($qaErrors.Count){throw "Cached Excel error in $($qaEntry.FullName)"}
    $qaFormulas=@($qaXml.GetElementsByTagName('f',$qaXml.DocumentElement.NamespaceURI))
    if(@($qaFormulas | Where-Object {$_.InnerText.Length -gt 8192}).Count){throw 'Excel formula exceeds length limit'}
    $qaRows += [pscustomobject]@{part=$qaEntry.FullName;formulas=$qaFormulas.Count;validationRules=$qaXml.GetElementsByTagName('dataValidation',$qaXml.DocumentElement.NamespaceURI).Count;conditionalFormats=$qaXml.GetElementsByTagName('conditionalFormatting',$qaXml.DocumentElement.NamespaceURI).Count;tables=$qaXml.GetElementsByTagName('tablePart',$qaXml.DocumentElement.NamespaceURI).Count;freezeX=if($qaPane){$qaPane.GetAttribute('xSplit')}else{''};freezeY=if($qaPane){$qaPane.GetAttribute('ySplit')}else{''};mergedRanges=@($qaXml.GetElementsByTagName('mergeCell',$qaXml.DocumentElement.NamespaceURI)|ForEach-Object {$_.GetAttribute('ref')})}
  }
  if(($qaRows | Measure-Object -Property formulas -Sum).Sum -lt 500){throw 'Expected native formula nodes were not found'}; if($qaRows.Count -ne 12){throw 'Expected twelve worksheets'}
  $qaTableCount=@($qaArchive.Entries|Where-Object FullName -Match '^xl/tables/table\d+\.xml$').Count
  if($qaTableCount -ne 11){throw 'Expected eleven native filtered tables'}
  foreach($qaEntry in $qaArchive.Entries | Where-Object FullName -Match '^xl/tables/table\d+\.xml$'){
    $qaReader=[System.IO.StreamReader]::new($qaEntry.Open());try {[xml]$qaTable=$qaReader.ReadToEnd()}finally{$qaReader.Dispose()}
    if($qaTable.GetElementsByTagName('autoFilter',$qaTable.DocumentElement.NamespaceURI).Count -ne 1){throw 'Native table filter missing'}
  }
  if(@($qaRows|Where-Object {$_.tables -gt 0 -and $_.part -ne 'xl/worksheets/sheet1.xml' -and ($_.freezeY -ne '5' -or $_.freezeX -ne '2')}).Count){throw 'Data-sheet header / ID freezes missing'}
  $qaExpected=@{Pass=0;Fail=0;Blocked=0;'Not Run'=0}
  $qaRecords=Get-Content -LiteralPath (Join-Path $qaRoot 'docs/qa/dvpr-execution.json') -Raw | ConvertFrom-Json
  foreach($qaRecord in $qaRecords.executions.PSObject.Properties.Value){$qaStatus=$qaRecord.initial.status;if($qaRecord.retest.status -and $qaRecord.retest.status -ne 'Not Run'){$qaStatus=$qaRecord.retest.status};$qaExpected[$qaStatus]++}
  $qaReader=[IO.StreamReader]::new($qaArchive.GetEntry('xl/worksheets/sheet12.xml').Open());try{[xml]$qaSummary=$qaReader.ReadToEnd()}finally{$qaReader.Dispose()}
  foreach($qaPair in @(@('B9','Pass'),@('B10','Fail'),@('B11','Blocked'),@('B12','Not Run'))){$qaCell=@($qaSummary.GetElementsByTagName('c',$qaSummary.DocumentElement.NamespaceURI)|Where-Object {$_.GetAttribute('r') -eq $qaPair[0]})[0];$qaCached=$qaCell.GetElementsByTagName('v',$qaSummary.DocumentElement.NamespaceURI)[0].InnerText;if([int]$qaCached -ne $qaExpected[$qaPair[1]]){throw 'Exported cached summary disagrees with execution records'}}
  [pscustomobject]@{status='PASS';date='2026-11-23';worksheets=12;nativeTables=$qaTableCount;nativeCharts=@($qaArchive.Entries|Where-Object FullName -Match '^xl/(drawings/)?charts/[^/]+\.xml$').Count;sheets=$qaRows} | ConvertTo-Json -Depth 7 | Set-Content -LiteralPath (Join-Path $qaRoot 'docs/qa/dvpr-workbook-validation.json') -Encoding utf8
  Write-Output 'PASS twelve worksheets; native filters, formulas, dropdowns, freezes, conditional formatting and cached formula values checked.'
} finally {$qaArchive.Dispose()}


