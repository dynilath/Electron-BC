module.exports = {
    files: '.\\BondageClub\\BondageClub\\index.html',
    from: /(<script src="Scripts\/Graph\.js"><\/script>\s+)(<script src="Scripts\/VariableHeight\.js"><\/script>)/m,
    to: (matches, m1, m2) => `${m1}<script>var exports = {};</script>\n<script src="../../build/renderer.js"></script>\n${m2}`,
};