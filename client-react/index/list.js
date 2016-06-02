/*
 * generator-xrm
 * https://github.com/BclEx/generator-xrm
 *
 * Copyright (c) 2015 Sky Morey, contributors
 * Licensed under the MIT license.
 */

'use strict';

// External libs.
var jsx = require('../../jsx');
var _ = require('lodash');
var chalk = require('chalk');

function q(s, ctx) {
    var camelCase = _.camelCase(ctx.name);
    return s.replace(/\$\{Name\}/g, ctx.name).replace(/\$\{name\}/g, camelCase).replace(/\$\{names\}/g, camelCase + 's');
}

function build(s, theme, ctx) {
    var lists = ctx.lists;
    if (!Array.isArray(lists)) {
        this.log(chalk.bold('ERR! ' + chalk.green('{ lists: }') + ' not array')); return null;
    }
    var mainList = _.find(lists, 'name', 'Main');
    if (!mainList) {
        this.log(chalk.bold('ERR! ' + chalk.green('{ lists.name == "Main" }') + ' not found')); return null;
    }
    if (!mainList.l) {
        this.log(chalk.bold('ERR! ' + chalk.green('{ list.l: }') + ' not found')); return null;
    }
    var t0 = s[0];
    t0.push(function (selector, $) {
        var elms = [];
        _.forOwn(mainList.l, function (value, key) {
            value.header = 'Address';
            value.field = key;
            elms.push({ div: { _attr: value } })
        });
        elms.push({ _attr: { data: '{this.props.${names}}', keyField: 'id', onSort: '{this.props.onSort}', onAction: '{this.actionHandler}' } });
        var render = 'return (\n\
' + jsx({ DataGrid: elms }) + ')';
        //         var render = 'return (\n\
        // <DataGrid data={this.props.${names}} keyField="id" onSort={this.props.onSort} onAction={this.actionHandler}>\n\
        //     <div header="Address" field="address" sortable={true} onLink={this.linkHandler}/>\n\
        //     <div header="City" field="city" sortable={true}/>\n\
        //     <div header="Bedrooms" field="bedrooms" textAlign="center"/>\n\
        //     <div header="Bathrooms" field="bathrooms" textAlign="center"/>\n\
        //     <div header="Price" field="price" sortable={true} textAlign="right" format="currency"/>\n\
        // </DataGrid>)';
        $.body.append(q("\
import React from 'react';\n\
import DataGrid from '../_components/DataGrid';\n\
export default React.createClass({\n\
    linkHandler(data) {\n\
        window.location.hash = '#${name}/' + data.id;\n\
    },\n\
    actionHandler(data, value, label) {\n\
        if (label === 'Delete') {\n\
            this.props.onDelete(data);\n\
        } else if (label === 'Edit') {\n\
            this.props.onEdit(data);\n\
        }\n\
    },\n\
    render() {" + $.verbatim(q(render, ctx)) + "}\n\
});", ctx));
    }.bind(this));
}

module.exports = {
    build: build,
};