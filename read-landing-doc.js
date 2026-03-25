const mammoth = require('mammoth');
const fs = require('fs');

const filePath = 'd:\\AI编程开发-02\\会展智能建联SaaS系统\\会展智能建联SaaS系统全套落地文件（定价+SOP+推广+路由表）.docx';

mammoth.extractRawText({path: filePath})
    .then(result => {
        fs.writeFileSync('landing-content.txt', result.value);
        console.log('落地文件内容已提取到 landing-content.txt');
    })
    .catch(err => {
        console.error('读取DOCX文件出错:', err);
    });
