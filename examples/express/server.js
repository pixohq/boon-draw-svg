// 필요한 모듈을 불러옵니다.
const express = require('express');
const path = require('path');
const cors = require('cors');
const { BoonDrawSVG } = require('boon-draw-svg');
const { readSVGFile, extractContentFromURL } = require('./utils');

// Express 앱을 생성합니다.
const app = express();

// BoonDrawSVG 인스턴스를 생성합니다.
const boonDrawer = new BoonDrawSVG();

// 미들웨어 설정
app.use(express.json()); // JSON 파싱을 위한 미들웨어 설정
app.use(express.urlencoded({ extended: false })); // URL 인코딩된 데이터를 파싱하기 위한 미들웨어 설정
// 모든 도메인에서의 요청을 허용합니다.
app.use(cors());
app.use(express.static(__dirname, {
  maxFileNameLength: 10000,
}))

// 정적 파일 제공을 위한 미들웨어 설정
app.use('/svg', express.static(path.join(__dirname, 'public')));

// /svg 라우트에 대한 요청 처리
app.get('/svg/:id', async (req, res) => {
  // SVG 파일의 고유 아이디
  const key = req.params.id;
  // req.query를 통해 쿼리 문자열을 추출합니다.
  const brandName = req.query.brandName;

  // SVG 파일의 경로
  const svgFilePath = path.join(__dirname, 'public', `${key}.svg`);

  try {
    // SVG 파일의 문자열을 읽어들임
    let svgString = await readSVGFile(svgFilePath);
    const targetId = 'target-dataId';

    if (brandName) {
      svgString = (await boonDrawer
        .initUniqueId(key, svgString, targetId)
        // TODO: font url()이 너무 길어서 파일 시스템에서 에러가 발생하고 있음
        .updateBrandName({ key, brandName, targetId }))
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

const svgPerPage = 20; // 한 페이지당 보여줄 SVG 파일 개수

app.get('/svg-list', (req, res) => {
  const page = parseInt(req.query.page) || 1; // 요청한 페이지 번호
  const startIndex = (page - 1) * svgPerPage;
  const endIndex = startIndex + svgPerPage;

  // SVG 파일의 경로
  const svgDirectory = path.join(__dirname, 'svgs'); // SVG 파일이 저장된 디렉토리 경로

  fs.readdir(svgDirectory, (err, files) => {
    if (err) {
      console.error('Error reading SVG directory:', err);
      return res.status(500).send('Internal Server Error');
    }

    const svgFiles = files.filter(file => path.extname(file) === '.svg'); // SVG 파일들만 필터링

    // 요청한 페이지에 해당하는 SVG 파일들의 서브셋을 가져옴
    const paginatedSvgFiles = svgFiles.slice(startIndex, endIndex);

    // 전체 SVG 파일 개수와 현재 페이지의 SVG 파일들을 클라이언트에 응답
    res.json({
      totalSvgCount: svgFiles.length,
      currentPage: page,
      svgFiles: paginatedSvgFiles
    });
  });
});

// 에러 핸들러 설정
app.use((err, req, res, next) => {
  // console.error(err.stack);
  res.status(500).send('Something broke!');
});

// 서버를 특정 포트(예: 3000)에서 실행합니다.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});