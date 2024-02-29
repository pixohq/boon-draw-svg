// 필요한 모듈을 불러옵니다.
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { DOMParser, XMLSerializer } = require('xmldom');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// DOMParser, XMLSerializer 인스턴스를 생성합니다.
const parser = new DOMParser();
const serializer = new XMLSerializer();

// 고정 상수를 생성합니다.
const svgDirectory = path.join(__dirname, 'svgs'); // SVG 파일이 저장된 디렉토리 경로

const updateDatasetHasOneText = async () => {
  try {
    const files = await readdir(svgDirectory);
    const svgFilePaths = files.filter((file) => path.extname(file) === '.svg').map(filePath => path.join(svgDirectory, filePath));

    for (const [index, svgFilePath] of svgFilePaths.entries()) {
      try {
        const svgString = await readFile(svgFilePath, 'utf8');
        const svgDoc = parser.parseFromString(svgString, 'text/xml');
        const allTexts = Array.from(svgDoc.documentElement.getElementsByTagName('text'));

        const isTextForBrandName = (text) => text?.getAttribute?.('class')?.includes?.('Text__Line');

        if (allTexts.length === 1 && isTextForBrandName(allTexts[0])) {
          allTexts[0].setAttribute('data-role', 'brand-name');
          const modifiedSvgString = serializer.serializeToString(svgDoc);
          await writeFile(svgFilePath, modifiedSvgString, 'utf8');
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

updateDatasetHasOneText();