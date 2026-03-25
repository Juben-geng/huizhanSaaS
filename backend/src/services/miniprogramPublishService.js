const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const archiver = require('archiver');
const wechatService = require('./wechatService');
const db = require('../models');

class MiniprogramPublishService {
  constructor() {
    this.tasks = new Map();
  }

  async createPublishTask(type, version, desc, userId) {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const task = {
      id: taskId,
      type,
      version,
      desc,
      userId,
      status: 'pending',
      progress: 0,
      logs: [],
      error: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.set(taskId, task);

    await this.saveTaskToDatabase(task);

    this.executeTask(taskId);

    return taskId;
  }

  async saveTaskToDatabase(task) {
    try {
      const MiniprogramPublish = db.MiniprogramPublish;
      
      if (MiniprogramPublish) {
        const publishRecord = await MiniprogramPublish.create({
          taskId: task.id,
          type: task.type,
          version: task.version,
          description: task.desc,
          userId: task.userId,
          status: task.status,
          progress: task.progress,
          logs: JSON.stringify(task.logs),
          createdAt: task.createdAt
        });

        task.dbId = publishRecord.id;
      }
    } catch (error) {
      console.error('保存任务到数据库失败:', error);
    }
  }

  async updateTaskStatus(taskId, status, progress, log = null) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = status;
    task.progress = progress;
    task.updatedAt = new Date();

    if (log) {
      task.logs.push({
        time: new Date(),
        message: log
      });
    }

    try {
      const MiniprogramPublish = db.MiniprogramPublish;
      if (MiniprogramPublish && task.dbId) {
        await MiniprogramPublish.update({
          status,
          progress,
          logs: JSON.stringify(task.logs),
          updatedAt: new Date()
        }, {
          where: { id: task.dbId }
        });
      }
    } catch (error) {
      console.error('更新任务状态失败:', error);
    }
  }

  async executeTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      await this.updateTaskStatus(taskId, 'building', 10, '开始构建项目...');

      const miniprogramPath = path.join(__dirname, '../../../miniprogram', task.type);

      if (!fs.existsSync(miniprogramPath)) {
        throw new Error(`小程序目录不存在: ${miniprogramPath}`);
      }

      await this.updateTaskStatus(taskId, 'building', 20, '清理构建文件...');

      await this.cleanBuild(miniprogramPath);

      await this.updateTaskStatus(taskId, 'building', 30, '压缩代码包...');

      const zipPath = await this.createZip(miniprogramPath, task.version);

      await this.updateTaskStatus(taskId, 'uploading', 50, '上传代码包到微信服务器...');

      const uploadResult = await wechatService.uploadCode(zipPath, task.version, task.desc);

      await this.updateTaskStatus(taskId, 'auditing', 70, '上传成功，提交审核...');

      const pages = await wechatService.getPage();
      const pageList = pages.slice(0, 5).map(p => p);

      await wechatService.submitAudit(pageList, task.desc);

      await this.updateTaskStatus(taskId, 'success', 100, '发布任务完成');

      fs.unlinkSync(zipPath);
    } catch (error) {
      await this.updateTaskStatus(taskId, 'failed', task.progress, `发布失败: ${error.message}`);
      console.error(`任务 ${taskId} 执行失败:`, error);
    }
  }

  async cleanBuild(miniprogramPath) {
    const dirsToClean = ['node_modules', '.git', 'unpackage'];

    for (const dir of dirsToClean) {
      const dirPath = path.join(miniprogramPath, dir);
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    }
  }

  async createZip(miniprogramPath, version) {
    return new Promise((resolve, reject) => {
      const outputFileName = `miniprogram_${version}_${Date.now()}.zip`;
      const outputPath = path.join(__dirname, '../../temp', outputFileName);

      if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      }

      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      output.on('close', () => {
        console.log(`压缩完成: ${outputPath} (${archive.pointer()} bytes)`);
        resolve(outputPath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(miniprogramPath, false);
      archive.finalize();
    });
  }

  async getTaskStatus(taskId) {
    const task = this.tasks.get(taskId);

    if (task) {
      return {
        taskId: task.id,
        type: task.type,
        version: task.version,
        status: task.status,
        progress: task.progress,
        logs: task.logs,
        error: task.error,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      };
    }

    try {
      const MiniprogramPublish = db.MiniprogramPublish;
      if (MiniprogramPublish) {
        const dbTask = await MiniprogramPublish.findOne({
          where: { taskId }
        });

        if (dbTask) {
          return {
            taskId: dbTask.taskId,
            type: dbTask.type,
            version: dbTask.version,
            status: dbTask.status,
            progress: dbTask.progress,
            logs: JSON.parse(dbTask.logs || '[]'),
            error: dbTask.error,
            createdAt: dbTask.createdAt,
            updatedAt: dbTask.updatedAt
          };
        }
      }
    } catch (error) {
      console.error('从数据库获取任务状态失败:', error);
    }

    return null;
  }

  async getPublishHistory(page = 1, limit = 10) {
    try {
      const MiniprogramPublish = db.MiniprogramPublish;
      if (MiniprogramPublish) {
        const { rows, count } = await MiniprogramPublish.findAndCountAll({
          order: [['createdAt', 'DESC']],
          limit,
          offset: (page - 1) * limit
        });

        return {
          total: count,
          page,
          limit,
          data: rows.map(row => ({
            id: row.id,
            taskId: row.taskId,
            type: row.type,
            version: row.version,
            description: row.description,
            status: row.status,
            progress: row.progress,
            createdAt: row.createdAt
          }))
        };
      }

      return {
        total: 0,
        page,
        limit,
        data: []
      };
    } catch (error) {
      console.error('获取发布历史失败:', error);
      return {
        total: 0,
        page,
        limit,
        data: []
      };
    }
  }

  async deletePublishRecord(id) {
    try {
      const MiniprogramPublish = db.MiniprogramPublish;
      if (MiniprogramPublish) {
        await MiniprogramPublish.destroy({
          where: { id }
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除发布记录失败:', error);
      return false;
    }
  }

  async rollback(taskId) {
    try {
      await this.updateTaskStatus(taskId, 'rolling_back', 50, '开始回滚小程序版本...');

      await wechatService.rollbackRelease();

      await this.updateTaskStatus(taskId, 'rolled_back', 100, '回滚成功');

      return true;
    } catch (error) {
      await this.updateTaskStatus(taskId, 'failed', 50, `回滚失败: ${error.message}`);
      throw error;
    }
  }

  async publish(taskId) {
    try {
      await this.updateTaskStatus(taskId, 'publishing', 90, '开始发布小程序...');

      await wechatService.release();

      await this.updateTaskStatus(taskId, 'success', 100, '发布成功');

      return true;
    } catch (error) {
      await this.updateTaskStatus(taskId, 'failed', 90, `发布失败: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new MiniprogramPublishService();
