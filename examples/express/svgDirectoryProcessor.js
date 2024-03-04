// 필요한 모듈을 불러옵니다.
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { DOMParser } = require('xmldom');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// DOMParser, XMLSerializer 인스턴스를 생성합니다.
const parser = new DOMParser();

// 고정 상수를 생성합니다.
const svgDirectory = path.join(__dirname, 'svgs'); // SVG 파일이 저장된 디렉토리 경로
const svgMoreThan2Directory = path.join(__dirname, 'svgs-more-than-2'); // SVG 파일이 저장된 디렉토리 경로

const process = async () => {
  try {
    const files = await readdir(svgDirectory);
    const svgFilePaths = files.filter((file) => path.extname(file) === '.svg').map(filePath => path.join(svgDirectory, filePath));

    for (const [index, svgFilePath] of svgFilePaths.entries()) {
      try {
        const svgString = await readFile(svgFilePath, 'utf8');
        const svgDoc = parser.parseFromString(svgString, 'text/xml');
        const allTexts = Array.from(svgDoc.documentElement.getElementsByTagName('text'));

        if (allTexts.length >= 2) {
          const fileName = svgFilePath.split('/')[svgFilePath.split('/').length - 1];
          await writeFile(path.join(svgMoreThan2Directory, fileName), svgString, 'utf8');
          console.log('SVG file has been updated successfully:', index);
        }
      } catch (error) {
        console.error('Error processing SVG file:', error);
      }
    }
  } catch (error) {
    console.error('Error reading SVG directory:', error);
  }
};

process();