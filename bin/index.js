#!/usr/bin/env node

var {program} = require('commander');
var {version} = require('../package');
var compiler = require('..');

program
    .version(version)
    .option('-d, --directory <dirname>', 'directory in which resources will be investigated')
    .option('--ctor <Constructor>', 'resource constructor name, default Resources.Resource')
    .option('--resource-directory <dirname>', 'name of resource directories, default resources')
    .option('--cname <Component>', 'name of generated component, default Resources');

program.parse(process.argv);
var args = program.opts();

compiler.compile(args['directory'] || process.cwd(), args['ctor'], args['resource-directory'], args['cname']).then((components) => {
    components.forEach((cname) => {
        console.log(`${cname} has been generated`);
    });
}).catch((err) => {
    console.error(err.message);
});
