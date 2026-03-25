<template>
  <router-view />
</template>

<script setup>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

@media (max-width: 768px) {
  .el-col {
    flex: 0 0 100%;
    max-width: 100%;
  }
  
  .stats-row .el-col {
    margin-bottom: 12px;
  }
  
  .charts-row .el-col {
    margin-bottom: 16px;
  }
  
  .data-row .el-col {
    margin-bottom: 16px;
  }
  
  .chart {
    height: 250px !important;
  }
  
  .stat-value {
    font-size: 24px !important;
  }
  
  .el-dialog {
    width: 95% !important;
    margin: 0 auto !important;
  }
  
  .el-table {
    font-size: 12px;
  }
  
  .search-form {
    flex-direction: column;
  }
  
  .search-form .el-form-item {
    width: 100%;
  }
}

@media (max-width: 576px) {
  .stat-card {
    margin-bottom: 8px;
  }
  
  .stat-icon {
    width: 48px !important;
    height: 48px !important;
    font-size: 20px !important;
  }
  
  .stat-value {
    font-size: 20px !important;
  }
  
  .stat-label {
    font-size: 12px !important;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .pagination-container {
    justify-content: center;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .stats-row .el-col {
    flex: 0 0 50%;
    max-width: 50%;
  }
  
  .charts-row .el-col:first-child {
    flex: 0 0 100%;
    max-width: 100%;
  }
  
  .charts-row .el-col:last-child {
    flex: 0 0 100%;
    max-width: 100%;
  }
  
  .data-row .el-col {
    flex: 0 0 100%;
    max-width: 100%;
    margin-bottom: 16px;
  }
}
</style>
