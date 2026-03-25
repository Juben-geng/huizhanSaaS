const mammoth = require('mammoth');
const fs = require('fs');

const filePath = 'd:\\AI编程开发-02\\会展智能建联SaaS系统\\会展智能建联SaaS系统（最终PRD）_ 产品细则+AI开发直用技术文档【优化版】.docx';

mammoth.extractRawText({path: filePath})
    .then(result => {
        fs.writeFileSync('prd-content.txt', result.value);
        console.log('DOCX文件内容已提取到 prd-content.txt');
    })
    .catch(err => {
        console.error('读取DOCX文件出错:', err);
    });
