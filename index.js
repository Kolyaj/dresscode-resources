var {DressCode} = require('dresscodejs');
var path = require('path');
var fs = require('fs-extra');
var mime = require('mime/lite');

module.exports.compile = async function(directory, resourceCtor, resourcesDirName, resourcesComponent) {
    directory = path.resolve(directory);
    resourceCtor = resourceCtor || 'Resources.Resource';
    resourcesDirName = resourcesDirName || 'resources';
    resourcesComponent = resourcesComponent || 'Resources';
    var dresscode = new DressCode();
    var dresscodeFileContent = await dresscode.getDresscodeFileContent(directory);
    if (!dresscodeFileContent.includes(directory)) {
        throw new Error(`Directory ${directory} is not a DressCode library.`);
    }
    var components = await dresscode.getComponentsInDir(directory);
    var indexFiles = components.filter((component) => {
        return /\/index.js/.test(component.fname);
    });
    var generatedComponents = [];
    await Promise.all(indexFiles.map(async(indexFile) => {
        var dirname = path.dirname(indexFile.fname);
        var resourceCname = `${indexFile.cname}.${resourcesComponent}`;
        var [resourceFileContent] = await compileResources(path.join(dirname, resourcesDirName), '', resourceCname, resourceCtor);
        var resourceFile = path.join(dirname, `${resourcesComponent}.js`);
        if (resourceFileContent) {
            await fs.outputFile(resourceFile, `${resourceCname} = {};\n${resourceFileContent}`, 'utf8');
            generatedComponents.push(resourceCname);
        } else if (await fs.pathExists(resourceFile)) {
            await fs.remove(resourceFile);
        }
    }));
    return generatedComponents;
};

async function compileResources(basedir, subdir, cname, ctor) {
    try {
        // try-catch checks directory doesn't exist
        var diritems = await fs.readdir(path.join(basedir, subdir));
    } catch (ignores) {
    }
    if (diritems) {
        var result = '';
        var resources = [];
        await Promise.all(diritems.map(async(fname) => {
            if (!fname.startsWith('.')) {
                var localName = path.join(subdir, fname);
                var normalizedLocalName = localName.replace(/\\/g, '/')
                var fullname = path.join(basedir, localName);
                var stat = await fs.stat(fullname);
                if (stat.isFile()) {
                    var fcontent = await fs.readFile(fullname, 'binary');
                    var mimeType = mime.getType(path.extname(fname));
                    result += `${cname}['${normalizedLocalName}'] = new ${ctor}('${mimeType}', '${Buffer.from(fcontent, 'binary').toString('base64')}');\n`;
                    resources.push(fname);
                } else if (stat.isDirectory()) {
                    var [dirresult, dirresources] = await compileResources(basedir, localName, cname, ctor);
                    result += dirresult;
                    var diritems = dirresources.map((resource) => {
                        resources.push(`${fname}/${resource}`);
                        return `    '${resource}': ${cname}['${normalizedLocalName}/${resource}']`;
                    });
                    result += `${cname}['${localName}'] = {\n${diritems.join(',\n')}\n};\n`
                }
            }
        }));
        return [result, resources];
    }
    return [];
}
