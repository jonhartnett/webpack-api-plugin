import {getOptions} from 'loader-utils';
import * as t from '@babel/types';
import generate from '@babel/generator';
import {parse} from '@babel/parser';
import { filter, map } from './util';

function generateUuid(prefix, scope){
    let id = prefix;
    let index = 0;
    while(scope.has(id))
        id = `${prefix}${index++}`;
    scope.add(id);
    return id;
}

export default function WebpackApiClientLoader(source){
    let {
        prefix,
        impl
    } = getOptions(this);

    let ast = parse(source, {
        sourceType: 'module'
    });
    t.assertFile(ast);
    let program = ast.program;
    t.assertProgram(program);

    let scope = new Set();
    let implId = t.identifier('');
    let prefixId = t.identifier('');

    program.body = [
        t.importDeclaration(
            [t.importDefaultSpecifier(implId)],
            t.stringLiteral(impl)
        ),
        t.variableDeclaration('const', [
            t.variableDeclarator(
                prefixId,
                t.stringLiteral(prefix)
            )
        ]),
        ...program.body
            ::filter(decl => t.isExportDeclaration(decl))
            ::map(decl => {
                if(!t.isExportNamedDeclaration(decl) && !t.isExportDefaultDeclaration(decl))
                    throw new Error();
                let funcDecl = decl.declaration;
                if(!t.isFunctionDeclaration(funcDecl))
                    throw new Error();
                let key;
                if(!t.isExportDefaultDeclaration(decl)){
                    let name = funcDecl.id.name;
                    scope.add(name);
                    key = t.stringLiteral(name);
                }else{
                    key = t.nullLiteral();
                }
                funcDecl.params = []; //delete params
                funcDecl.body.body = [
                    t.returnStatement(
                        t.callExpression(implId, [
                            prefixId,
                            key,
                            t.spreadElement(t.identifier('arguments'))
                        ])
                    )
                ];
                return decl;
            })
    ];

    implId.name = generateUuid('_impl', scope);
    prefixId.name = generateUuid('_prefix', scope);

    let gen = generate(ast, {
        sourceMaps: this.sourceMap,
        sourceFileName: this.resourcePath
    }, source);

    source = gen.code;
    let sourceMap = gen.map;

    this.callback(null, source, sourceMap);
}