// 필요한 모듈을 불러옵니다.
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

exports.getPaginationSvgFiles = async (req, res, svgDirectory) => {
  fs.readdir(svgDirectory, async (err, files) => {
    if (err) {
      console.error('Error reading SVG directory:', err);
      return res.status(500).send('Internal Server Error');
    }

    const offset = parseInt(req.query.offset) || 0; // 요청한 페이지 번호
    const limit = parseInt(req.query.limit) || 12; // 요청한 페이지 번호
    const startIndex = offset;
    const endIndex = offset + limit;

    const svgFiles = files.filter((file) => path.extname(file) === '.svg'); // SVG 파일들만 필터링

    // 요청한 페이지에 해당하는 SVG 파일들의 서브셋을 가져옴
    const paginatedSvgFiles = await Promise.all(
      svgFiles.slice(startIndex, endIndex).map(async (svgFilePath) => {
        const id = svgFilePath.split('.')[0];
        const templateSvg = await readFile(path.join(svgDirectory, svgFilePath) , 'utf8');

        return {
          id,
          templateSvg,
          brandNameId: 'brand-name',
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

    // 전체 SVG 파일 개수와 현재 페이지의 SVG 파일들을 클라이언트에 응답
    res.json({
      result: paginatedSvgFiles,
      total: svgFiles.length,
      offset: offset,
      limit: limit,
    });
  });
}