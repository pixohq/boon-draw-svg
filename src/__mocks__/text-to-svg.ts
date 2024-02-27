jest.mock('text-to-svg', () => {
  const load = (fontURL: string, callback: (error: string, textToSvg: any) => void) => {
    const getMetrics = () => {
      return {
        width: 100,
      };
    };

    callback('', {
      getMetrics,
    });
  };


  return {
    load,
  };
});
