/**
  * Potrace integration.
  *
  * Manages all app elements relating to Potrace functionality.
  */

export default class PotraceIntegration {
  constructor(app) {
    // *     Potrace API parameters:
    // *        turnpolicy ("black" / "white" / "left" / "right" / "minority" / "majority")
    // *          how to resolve ambiguities in path decomposition. (default: "minority")
    // *        turdsize
    // *          suppress speckles of up to this size (default: 2)
    // *        optcurve (true / false)
    // *          turn on/off curve optimization (default: true)
    // *        alphamax
    // *          corner threshold parameter (default: 1)
    // *        opttolerance
    // *          curve optimization tolerance (default: 0.2)
    Potrace.setParameter({
      alphamax: 1,
      optcurve: false,
      opttolerance: 0.2,
      turdsize: 100,
      turnpolicy: "black"
    });

    // $('.euclidpotraceConfig').on('change', () => {
    //   this.preview(app);
    // });
  }

  createSVG(src, callbackFn) {
    // Create an SVG from data and settings, draw to screen.
    Potrace.clear();
    Potrace.loadImageFromSrc(src);
    Potrace.process(function() {
      var svg = Potrace.getSVG(1);
    //   const randomColor = () => '#'+('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6);
    //   var newSVG = document.createElementNS('http://www.w3.org/2000/svg', "svg");
    //   // normalize should be used to get back absolute segments
    // const pathsDatas = jQuery(svg).find('path')[0].getPathData({ normalize: true }).reduce((acc, seg) => {
    //     const pathData = seg.type === 'M' ? [] : acc.pop();
    //     seg.values = seg.values.map((v) => Math.round(v * 1000) / 1000);
    //     pathData.push(seg);
    //     acc.push(pathData);

    //     return acc;
    //   }, []);

    //   pathsDatas.forEach(function(d) {
    //     const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    //     path.setPathData(d);
    //     path.setAttribute('fill', randomColor());
    //     newSVG.appendChild(path);
    //   });

      callbackFn(svg);
    });
  }

  preview() {
    // Potrace.setParameter({
    //   alphamax: $('.alphamax').val(),
    //   optcurve: $('.optcurve').is(":checked"),
    //   opttolerance: $('.opttolerance').val(),
    //   turdsize: $('.turdsize').val(),
    //   turnpolicy: $('.turnpolicy').find(":selected").text().toLowerCase()
    // });

    this.createSVG(window.euclid.src, function(svg) {
        const previewBox = jQuery(".imgedit-crop-preview");
        previewBox.html(svg);
    });
  }


}
