import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

const docPath = path.resolve('..', '毕业论文结构模板(按此结构写论文).docx');
mammoth.extractRawText({path: docPath})
    .then(function(result){
        const text = result.value; 
        console.log(text);
    })
    .catch(function(error) {
        console.error(error);
    });
