// 필요한 모듈을 불러옵니다.
const express = require('express');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const cors = require('cors');
const { DOMParser, XMLSerializer } = require('xmldom');
const { BoonDrawSVG } = require('boon-draw-svg');
const { getPaginationSvgFiles } = require('./getPaginationSvgFiles');
const { updateDataset } = require('./updateDataset');
const readFile = promisify(fs.readFile);

// Express 앱을 생성합니다.
const app = express();

// BoonDrawSVG 인스턴스를 생성합니다.
const boonDrawer = new BoonDrawSVG();

// 고정 상수를 생성합니다.
const ONE_HOUR = 60 * 60; // 1시간을 초 단위로 표현
const svgDirectory = path.join(__dirname, 'svgs'); // SVG 파일이 저장된 디렉토리 경로
const svgDirectory2 = path.join(__dirname, 'svgs2'); // SVG 파일이 저장된 디렉토리 경로

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
  return getPaginationSvgFiles(req, res, svgDirectory);
});

app.get('/svg-list2', (req, res) => {
  return getPaginationSvgFiles(req, res, svgDirectory2);
});

app.patch('/svg', async (req, res) => {
  return updateDataset(req, res, svgDirectory);
});

app.patch('/svg2', async (req, res) => {
  return updateDataset(req, res, svgDirectory2);
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
