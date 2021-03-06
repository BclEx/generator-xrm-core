
'use strict';

var XML_CHARACTER_MAP = {
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
    '<': '&lt;',
    '>': '&gt;'
};
function escapeForXML(string) {
    return string && (string.replace ? string.replace(/([&"<>'])/g, function (str, item) { return XML_CHARACTER_MAP[item]; }) : string);
}

function jsx(input) {
    var output = '', indent = '    ';
    function append(interrupt, out) {
        if (out !== undefined) {
            output += out;
        }
    }
    function add(value, last) {
        format(append, resolve(value, indent, indent ? 1 : 0), last);
    }
    function end() {
    }
    if (input && input.forEach) {
        input.forEach(function (value, i) {
            var last;
            if (i + 1 === input.length) {
                last = end;
            }
            add(value, last);
        });
    } else {
        add(input, end);
    }
    return output;
}

function element(/*input, …*/) {
    var input = Array.prototype.slice.call(arguments),
        self = {
            _elem: resolve(input)
        };
    self.push = function (input) {
        if (!this.append) {
            throw new Error("not assigned to a parent!");
        }
        var that = this;
        var indent = this._elem.indent;
        format(this.append, resolve(
            input, indent, this._elem.icount + (indent ? 1 : 0)),
            function () { that.append(true); });
    };
    self.close = function (input) {
        if (input !== undefined) {
            this.push(input);
        }
        if (this.end) {
            this.end();
        }
    };
    return self;
}

function create_indent(character, count) {
    return (new Array(count || 0).join(character || ''));
}

function resolve(data, indent, indent_count) {
    indent_count = indent_count || 0;
    var indent_spaces = create_indent(indent, indent_count);
    var name;
    var values = data;
    var interrupt = false;

    if (typeof data === 'object') {
        var keys = Object.keys(data);
        name = keys[0];
        values = data[name];

        if (values && values._elem) {
            values._elem.name = name;
            values._elem.icount = indent_count;
            values._elem.indent = indent;
            values._elem.indents = indent_spaces;
            values._elem.interrupt = values;
            return values._elem;
        }
    }

    var attributes = [], content = [];
    function get_attributes(obj) {
        var keys = Object.keys(obj);
        keys.forEach(function (key) {
            attributes.push(attribute(key, obj[key]));
        });
    }

    var isStringContent;
    switch (typeof values) {
        case 'object':
            if (values === null) { break; }
            if (values._attr) { get_attributes(values._attr); }
            if (values._cdata) { content.push(('<![CDATA[' + values._cdata).replace(/\]\]>/g, ']]]]><![CDATA[>') + ']]>'); }
            if (values.forEach) {
                isStringContent = false;
                content.push('');
                values.forEach(function (value) {
                    if (typeof value === 'object') {
                        var _name = Object.keys(value)[0];
                        if (_name === '_attr') { get_attributes(value._attr); }
                        else { content.push(resolve(value, indent, indent_count + 1)); }
                    } else {
                        //string
                        content.pop();
                        isStringContent = true;
                        content.push(escapeForXML(value));
                    }
                });
                if (!isStringContent) { content.push(''); }
            }
            break;
        default:
            //string
            content.push(escapeForXML(values));
    }

    return {
        name: name,
        interrupt: interrupt,
        attributes: attributes,
        content: content,
        icount: indent_count,
        indents: indent_spaces,
        indent: indent
    };
}

function format(append, elem, end) {
    if (typeof elem !== 'object') {
        return append(false, elem);
    }
    var len = elem.interrupt ? 1 : elem.content.length;
    function proceed() {
        while (elem.content.length) {
            var value = elem.content.shift();
            if (value === undefined) { continue; }
            if (interrupt(value)) { return; }
            format(append, value);
        }
        append(false, (len > 1 ? elem.indents : '') +
            (elem.name ? '</' + elem.name + '>' : '') +
            (elem.indent && !end ? '\n' : ''));
        if (end) {
            end();
        }
    }
    function interrupt(value) {
        if (value.interrupt) {
            value.interrupt.append = append;
            value.interrupt.end = proceed;
            value.interrupt = false;
            append(true);
            return true;
        }
        return false;
    }
    append(false, elem.indents +
        (elem.name ? '<' + elem.name : '') +
        (elem.attributes.length ? ' ' + elem.attributes.join(' ') : '') +
        (len ? (elem.name ? '>' : '') : (elem.name ? '/>' : '')) +
        (elem.indent && len > 1 ? '\n' : ''));
    if (!len) {
        return append(false, elem.indent ? '\n' : '');
    }
    if (!interrupt(elem)) {
        proceed();
    }
}

function attribute(key, value) {
    if (value[0] !== '{') {
        return key + '=' + '"' + escapeForXML(value) + '"';
    }
    return key + '=' + value;
}

module.exports = jsx;
module.exports.element = module.exports.Element = element;