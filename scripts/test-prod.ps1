 $psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = 'node.exe'
$psi.Arguments = 'dist\server.js'
$psi.WorkingDirectory = (Get-Location).Path
$psi.UseShellExecute = $false
$psi.EnvironmentVariables['NODE_ENV'] = 'production'
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$p = [System.Diagnostics.Process]::Start($psi)
Start-Sleep -Seconds 5
Write-Output ("STDOUT: " + $p.StandardOutput.ReadToEnd())
Write-Output ("STDERR: " + $p.StandardError.ReadToEnd())
try { Write-Output ("HEALTH: " + (Invoke-WebRequest http://localhost:3000/api/health -UseBasicParsing -TimeoutSec 5).Content) } catch { Write-Output ("HEALTH FAIL: " + $_.Exception.Message) }
try { $h = Invoke-WebRequest http://localhost:3000/ -UseBasicParsing -TimeoutSec 5; Write-Output ("ROOT: " + $h.StatusCode + " len=" + $h.Content.Length) } catch { Write-Output ("ROOT FAIL: " + $_.Exception.Message) }
try { Write-Output ("PRODUCTS: " + (Invoke-WebRequest http://localhost:3000/api/products -UseBasicParsing -TimeoutSec 5).StatusCode) } catch { Write-Output ("PRODUCTS FAIL: " + $_.Exception.Message) }
Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
