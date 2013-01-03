JS.Packages(function() { with(this) {
    file('http://underscorejs.org/underscore-min.js')
        .provides('_');

    file('builder/editor.js')
        .provides('UltraWebEngine.ShaderEditor')
        .requires('_', 'JS.Class');
}});
