$body = @{
  username = "teacher"
  password = "teacher123456"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/platform/auth/login" -Method Post -Body $body -ContentType "application/json"

Write-Host "Response Code:" $response.code
Write-Host "Response Message:" $response.msg
if ($response.code -eq 200) {
  Write-Host "`n✅ Teacher Login SUCCESS!" -ForegroundColor Green
  Write-Host "Token:" $response.data.token
  Write-Host "User Info:"
  $response.data.user | ConvertTo-Json -Depth 3
} else {
  Write-Host "`n❌ Teacher Login FAILED!" -ForegroundColor Red
}
