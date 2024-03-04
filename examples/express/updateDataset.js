// 필요한 모듈을 불러옵니다.
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { DOMParser, XMLSerializer } = require('xmldom');
const readFile = promisify(fs.readFile);

exports.updateDataset = async (req, res, svgDirectory) => {
  const templateId = req.query.templateId;
  const textIndex = parseInt(req.query.textIndex);

  if (!templateId || typeof templateId !== 'string') {
    console.error('Error getting templateId');
    res.status(500).send('Cannot found templateId');
  }

  if (isNaN(textIndex)) {
    console.error('Error getting textIndex');
    res.status(500).send('Cannot found textIndex');
  }

  const svgFilePath = path.join(svgDirectory, `${templateId}.svg`);

  try {
    const svgString = await readFile(svgFilePath, 'utf8');

    try {
      // XML 파서를 사용하여 SVG 데이터 파싱
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, 'text/xml');

      const texts = Array.from(svgDoc.documentElement.getElementsByTagName('text'));
      texts.forEach((textElement) => textElement.removeAttribute('data-role'));
      texts[textIndex].setAttribute('data-role', 'brand-name');

      // 변경된 SVG 데이터를 문자열로 변환하여 파일에 씀
      const serializer = new XMLSerializer();
      const modifiedSvgString = serializer.serializeToString(svgDoc);

      fs.writeFile(svgFilePath, modifiedSvgString, 'utf8', (err) => {
        if (err) {
          console.error('Error writing SVG file:', err);
          return res.status(500).send('Internal Server Error');
        }
        console.log('SVG file has been updated successfully');
        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(modifiedSvgString);
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  } catch (error) {
    console.error('Error reading SVG file:', error);
    return res.status(500).send('Internal Server Error');
  }
}