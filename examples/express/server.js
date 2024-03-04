// 필요한 모듈을 불러옵니다.
const express = require('express');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const cors = require('cors');
const { DOMParser, XMLSerializer } = require('xmldom');
const { BoonDrawSVG } = require('boon-draw-svg');
const readFile = promisify(fs.readFile);

// Express 앱을 생성합니다.
const app = express();

// BoonDrawSVG 인스턴스를 생성합니다.
const boonDrawer = new BoonDrawSVG();

// 고정 상수를 생성합니다.
const ONE_HOUR = 60 * 60; // 1시간을 초 단위로 표현
const svgDirectory = path.join(__dirname, 'svgs'); // SVG 파일이 저장된 디렉토리 경로

// 미들웨어 설정
app.use(express.json()); // JSON 파싱을 위한 미들웨어 설정
app.use(express.urlencoded({ extended: false })); // URL 인코딩된 데이터를 파싱하기 위한 미들웨어 설정
// 모든 도메인에서의 요청을 허용합니다.
app.use(cors());
app.use(
  express.static(__dirname, {
    maxFileNameLength: 10000,
  })
);

// 정적 파일 제공을 위한 미들웨어 설정
app.use('/svg', express.static(path.join(__dirname, 'public')));

// /svg 라우트에 대한 요청 처리
app.get('/svg/:id', async (req, res) => {
  // SVG 파일의 고유 아이디
  const key = req.params.id;
  // req.query를 통해 쿼리 문자열을 추출합니다.
  const brandName = req.query.brandName;

  // SVG 파일의 경로
  const svgFilePath = path.join(svgDirectory, `${key}.svg`);

  try {
    // SVG 파일의 문자열을 읽어들임
    let svgString = await readFile(svgFilePath, 'utf8');
    const targetId = 'brand-name';

    if (brandName) {
      svgString = (await boonDrawer
          .init(key, svgString, targetId)
          // TODO: font url()이 너무 길어서 파일 시스템에서 에러가 발생하고 있음
          .updateBrandName({ key, brandName, targetId })
        )
        .setFullWidth(key)
        .getSvgString(key);
    } else {
      svgString = boonDrawer
      .initUniqueId(key, svgString, targetId)
      .setFullWidth(key)
      .getSvgString(key);
    }
    
    // 클라이언트에게 SVG 파일의 문자열을 응답
    res.send(svgString);
  } catch (error) {
    console.error('Error reading SVG file:', error);

    // 오류가 발생하면 500 Internal Server Error 응답을 보냄
    res.status(500).send('Internal Server Error');
  }
});

app.get('/svg-list', (req, res) => {
  const offset = parseInt(req.query.offset) || 0; // 요청한 페이지 번호
  const limit = parseInt(req.query.limit) || 12; // 요청한 페이지 번호
  const startIndex = offset;
  const endIndex = offset + limit;

  fs.readdir(svgDirectory, async (err, files) => {
    if (err) {
      console.error('Error reading SVG directory:', err);
      return res.status(500).send('Internal Server Error');
    }

    const svgFiles = files.filter((file) => path.extname(file) === '.svg'); // SVG 파일들만 필터링

    // 요청한 페이지에 해당하는 SVG 파일들의 서브셋을 가져옴
    const paginatedSvgFiles = await Promise.all(
      svgFiles.slice(startIndex, endIndex).map(async (svgFilePath) => {
        const id = svgFilePath.split('.')[0];
        const templateSvg = await readFile(`./svgs/${svgFilePath}`, 'utf8');

        return {
          id,
          templateSvg,
          brandNameId: 'target-dataId',
          categories: [],
          colors: [],
          thumbnailUrl: '',
          createdAt: 123,
          updatedAt: 123,
          metadata: { editorVerCompatibilities: [] },
          ratio: '1:1',
        };
      })
    );

    // // 캐시 헤더 설정
    // res.set('Cache-Control', `public, max-age=${ONE_HOUR}`);

    // 전체 SVG 파일 개수와 현재 페이지의 SVG 파일들을 클라이언트에 응답
    res.json({
      result: paginatedSvgFiles,
      total: svgFiles.length,
      offset: offset,
      limit: limit,
    });
  });
});

app.patch('/svg', async (req, res) => {
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
});

// 에러 핸들러 설정
app.use((err, req, res, next) => {
  res.status(500).send('Something broke!');
});

// 서버를 특정 포트(예: 3000)에서 실행합니다.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
