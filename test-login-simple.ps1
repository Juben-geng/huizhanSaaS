try {
  $body = @{
    username = "teacher"
    password = "teacher123456"
  } | ConvertTo-Json

  $response = Invoke-WebRequest -Uri "http://localhost:3001/api/platform/auth/login" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 5

  Write-Host "Status:" $response.StatusCode
  Write-Host "Response:" $response.Content
  $json = $response.Content | ConvertFrom-Json
  if ($json.code -eq 200) {
    Write-Host "`nSUCCESS! Token:" $json.data.token
  } else {
    Write-Host "`nFAILED:" $json.msg
  }
} catch {
  Write-Host "ERROR:" $_.Exception.Message
}
