(function() {
  var MARKUP;

  MARKUP = {
    bold: {
      keyCode: 66,
      title: 'Bold (Ctrl+B)',
      placeholder: 'bold text',
      open: '[b]',
      close: '[/b]'
    },
    italic: {
      keyCode: 73,
      title: 'Italic (Ctrl+I)',
      placeholder: 'italic text',
      open: '[i]',
      close: '[/i]'
    },
    center: {
      keyCode: 69,
      title: 'Center (Ctrl+E)',
      placeholder: 'center text',
      open: '[center]',
      close: '[/center]'
    },
    hyperlink: {
      keyCode: 76,
      title: 'Hyperlink (Ctrl+L)',
      placeholder: 'link text',
      open: function() {
        var url;
        url = prompt('Please enter the URL of your link', 'http://') || 'link url';
        return "[url=" + url + "]";
      },
      close: '[/url]'
    },
    blockquote: {
      keyCode: 190,
      title: 'Blockquote (Ctrl+.)',
      placeholder: 'blockquote',
      open: '[quote]',
      close: '[/quote]'
    },
    code: {
      keyCode: 76,
      title: 'Code (Ctrl+K)',
      placeholder: 'print("code sample");',
      open: '[code]',
      close: '[/code]'
    },
    image: {
      keyCode: 71,
      placeholder: 'image url',
      open: '[img]',
      close: '[/img]'
    },
    nlist: {
      keyCode: 79,
      title: 'Numbered List (Ctrl+O)',
      placeholder: 'list item',
      open: function(value) {
        var close, open, _ref, _ref2;
        open = ((_ref = value.match(/\[list=1\]/g)) != null ? _ref.length : void 0) || 0;
        close = ((_ref2 = value.match(/\[\/list\]/g)) != null ? _ref2.length : void 0) || 0;
        if (open === close) return '[list=1]\n\t[*]';
        return '\t[*]';
      },
      close: function(value) {
        var close, open, _ref, _ref2;
        open = ((_ref = value.match(/\[list=1\]/g)) != null ? _ref.length : void 0) || 0;
        close = ((_ref2 = value.match(/\[\/list\]/g)) != null ? _ref2.length : void 0) || 0;
        if (open === close) return '\n[/list]';
      }
    },
    list: {
      keyCode: 85,
      title: 'Bulleted List (Ctrl+O)',
      placeholder: 'list item',
      open: function(value) {
        var close, open, _ref, _ref2;
        open = ((_ref = value.match(/\[list\]/g)) != null ? _ref.length : void 0) || 0;
        close = ((_ref2 = value.match(/\[\/list\]/g)) != null ? _ref2.length : void 0) || 0;
        if (open === close) return '[list]\n\t[*]';
        return '\t[*]';
      },
      close: function(value) {
        var close, open, _ref, _ref2;
        open = ((_ref = value.match(/\[list\]/g)) != null ? _ref.length : void 0) || 0;
        close = ((_ref2 = value.match(/\[\/list\]/g)) != null ? _ref2.length : void 0) || 0;
        if (open === close) return '\n[/list]';
      }
    },
    heading: {
      keyCode: 72,
      title: 'Heading (Ctrl+H)',
      placeholder: 'heading',
      open: '[h3]',
      close: '[/h3]',
      before: /\n$/,
      after: /^\n/
    },
    hrule: {
      keyCode: 82,
      title: 'Hprizontal Rule (Ctrl+R)',
      open: '[hr]\n',
      before: /\n\n$/,
      after: /^\n\n/
    }
  };

  this.bbcode.Editor = (function() {

    function Editor(textarea, markup) {
      var _this = this;
      this.markup = markup != null ? markup : MARKUP;
      this.$ = $(textarea);
      this.textarea = this.$[0];
      this.$.on('keydown', function(e) {
        var end, length, line, lines, offset, selection, start, tab, _i, _len, _ref, _ref2, _ref3, _ref4;
        if (e.which === 9) {
          selection = _this.getSelection();
          offset = 0;
          if (selection.start === selection.end && !e.shiftKey) {
            offset++;
            selection.value[1] = "\t" + selection.value[1];
            _this.setValue(selection.value.join(''));
          } else {
            length = 0;
            tab = false;
            lines = [];
            _ref = _this.textarea.value.split('\n');
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              line = _ref[_i];
              _ref2 = [length, length += line.length + 1], start = _ref2[0], end = _ref2[1];
              if (!tab && (start <= (_ref3 = selection.start) && _ref3 < end)) {
                tab = true;
              }
              if (tab) {
                if (e.shiftKey) {
                  if (line[0] === '\t') {
                    line = line.slice(1);
                    offset--;
                  }
                } else {
                  line = "\t" + line;
                  offset++;
                }
                tab = !((start <= (_ref4 = selection.end) && _ref4 <= end));
              }
              lines.push(line);
            }
            _this.setValue(lines.join('\n'));
          }
          if (offset > 0) {
            selection.start++;
          } else if (offset < 0) {
            selection.start--;
          }
          _this.select(selection.start, selection.end + offset);
        } else if (!e.ctrlKey || !(_this.getRule(e.which) != null)) {
          return true;
        } else {
          _this.replace(e.which);
        }
        return false;
      });
    }

    Editor.prototype._escapeRe = function(pattern) {
      var escaped, special;
      special = ['/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\', '^', '$'];
      escaped = pattern.replace(new RegExp('(\\' + special.join('|\\') + ')', 'g'), '\\$1');
      return new RegExp('^' + escaped.replace(/\d+/, '\\d+') + '$');
    };

    Editor.prototype.getRule = function(keyCode) {
      var key, rule, _ref;
      _ref = this.markup;
      for (key in _ref) {
        rule = _ref[key];
        if (rule.keyCode === keyCode) return rule;
      }
    };

    Editor.prototype.replace = function(keyCode, value, text) {
      var close, open, replacement, rule, selection, start;
      this.$.focus();
      selection = this.getSelection();
      rule = this.getRule(keyCode);
      value = this.textarea.value;
      open = (typeof rule.open === 'function' ? rule.open(selection.value[0]) : rule.open) || '';
      close = (typeof rule.close === 'function' ? rule.close(selection.value[2]) : rule.close) || '';
      if (this._escapeRe(open).test(value.slice(selection.start - open.length, selection.start)) && this._escapeRe(close).test(value.slice(selection.end, selection.end + close.length))) {
        start = selection.start - open.length;
        this.setValue(value.substr(0, start) + selection.value[1] + value.substr(selection.end + close.length, value.length));
        return this.select(start, start + selection.value[1].length);
      } else {
        replacement = open + (text || selection.value[1] || rule.placeholder || '') + close;
        if ((rule.before != null) && !rule.before.test(selection.value[0])) {
          replacement = "\n\n" + replacement;
          selection.start += 2;
        }
        if ((rule.after != null) && !rule.after.test(selection.value[2])) {
          replacement += '\n\n';
          selection.end += 2;
        }
        this.setValue(selection.value[0] + replacement + selection.value[2]);
        return this.select(selection.start + open.length, selection.start + replacement.length - close.length);
      }
    };

    Editor.prototype.setValue = function(value) {
      var position;
      position = this.$.scrollTop();
      this.$.val(value);
      return this.$.scrollTop(position);
    };

    Editor.prototype.select = function(start, end) {
      var range, _ref;
      if (((_ref = document.selection) != null ? _ref.createRange : void 0) != null) {
        range = this.textarea.createTextRange();
        range.collapse(true);
        range.moveStart('character', start);
        range.moveEnd('character', end - start);
        return range.select();
      } else {
        this.textarea.selectionStart = start;
        return this.textarea.selectionEnd = end;
      }
    };

    Editor.prototype.getSelection = function() {
      var close, end, open, range, selection, start, storedRange, value, _ref;
      value = this.textarea.value;
      if (((_ref = document.selection) != null ? _ref.createRange : void 0) != null) {
        if (!/testarea/i.test(this.textarea.tagName)) {
          range = selection.createRange().duplicate();
          range.moveEnd('character', value.length);
          start = range.text === '' ? value.length : value.lastIndexOf(range.text);
          range = selection.createRange().duplicate();
          range.moveStart('character', -value.length);
          end = range.text.length;
        } else {
          range = selection.createRange();
          storedRange = range.duplicate();
          storedRange.moveToElementText(this.textarea);
          storedRange.setEndPoint('EndToEnd', range);
          start = storedRange.text.length - range.text.length;
          end = start + range.text.length;
        }
      } else {
        start = this.textarea.selectionStart;
        end = this.textarea.selectionEnd;
      }
      open = value.substring(0, start);
      close = value.substring(end, value.length);
      return selection = {
        start: start,
        end: end,
        value: [open, value.substring(start, end), close]
      };
    };

    return Editor;

  })();

}).call(this);
