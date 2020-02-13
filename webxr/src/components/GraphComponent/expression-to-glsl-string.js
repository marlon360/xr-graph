export default function expressionToGlslString(tokens) {
  
  var INUMBER = 'INUMBER';
  var IOP1 = 'IOP1';
  var IOP2 = 'IOP2';
  var IOP3 = 'IOP3';
  var IVAR = 'IVAR';
  var IVARNAME = 'IVARNAME';
  var IFUNCALL = 'IFUNCALL';
  var IFUNDEF = 'IFUNDEF';
  var IEXPR = 'IEXPR';
  var IEXPREVAL = 'IEXPREVAL';
  var IMEMBER = 'IMEMBER';
  var IENDSTATEMENT = 'IENDSTATEMENT';
  var IARRAY = 'IARRAY';

  var nstack = [];
  var n1, n2, n3;
  var f, args, argCount;
  for (var i = 0; i < tokens.length; i++) {
    var item = tokens[i];
    var type = item.type;
    if (type === INUMBER) {
      if (typeof item.value === 'number' && item.value < 0) {
        if (!item.value.toString().includes('.')) {
          item.value = parseFloat(item.value).toFixed(2);
        }
        nstack.push('(' + item.value + ')');
      } else if (Array.isArray(item.value)) {
        nstack.push('[' + item.value.map(escapeValue).join(', ') + ']');
      } else {
        if (!item.value.toString().includes('.')) {
          item.value = parseFloat(item.value).toFixed(2);
        }
        nstack.push(item.value);
      }
    } else if (type === IOP2) {
      n2 = nstack.pop();
      n1 = nstack.pop();
      f = item.value;
      if (f === '^') {
        nstack.push(Array.apply(null, Array(parseInt(n2))).map(() => n1).join("*"));
      } else if (f === 'and') {
        nstack.push('(!!' + n1 + ' && !!' + n2 + ')');
      } else if (f === 'or') {
        nstack.push('(!!' + n1 + ' || !!' + n2 + ')');
      } else if (f === '||') {
        nstack.push('(function(a,b){ return Array.isArray(a) && Array.isArray(b) ? a.concat(b) : String(a) + String(b); }((' + n1 + '),(' + n2 + ')))');
      } else if (f === '==') {
        nstack.push('(' + n1 + ' === ' + n2 + ')');
      } else if (f === '!=') {
        nstack.push('(' + n1 + ' !== ' + n2 + ')');
      } else if (f === '[') {
        nstack.push(n1 + '[(' + n2 + ') | 0]');
      } else {
        nstack.push('(' + n1 + ' ' + f + ' ' + n2 + ')');
      }
    } else if (type === IOP3) {
      n3 = nstack.pop();
      n2 = nstack.pop();
      n1 = nstack.pop();
      f = item.value;
      if (f === '?') {
        nstack.push('(' + n1 + ' ? ' + n2 + ' : ' + n3 + ')');
      } else {
        throw new Error('invalid Expression');
      }
    } else if (type === IVAR || type === IVARNAME) {
      nstack.push(item.value);
    } else if (type === IOP1) {
      n1 = nstack.pop();
      f = item.value;
      if (f === '-' || f === '+') {
        nstack.push('(' + f + n1 + ')');
      }
      if (f === 'not') {
        nstack.push('(' + '!' + n1 + ')');
      } else if (f === '!') {
        nstack.push('fac(' + n1 + ')');
      } else {
        nstack.push(f + '(' + n1 + ')');
      }
    } else if (type === IFUNCALL) {
      argCount = item.value;
      args = [];
      while (argCount-- > 0) {
        args.unshift(nstack.pop());
      }
      f = nstack.pop();
      nstack.push(f + '(' + args.join(', ') + ')');
    } else if (type === IFUNDEF) {
      n2 = nstack.pop();
      argCount = item.value;
      args = [];
      while (argCount-- > 0) {
        args.unshift(nstack.pop());
      }
      n1 = nstack.pop();
      nstack.push('(' + n1 + ' = function(' + args.join(', ') + ') { return ' + n2 + ' })');
    } else if (type === IMEMBER) {
      n1 = nstack.pop();
      nstack.push(n1 + '.' + item.value);
    } else if (type === IARRAY) {
      argCount = item.value;
      args = [];
      while (argCount-- > 0) {
        args.unshift(nstack.pop());
      }
      var dataType = 'vec' + args.length;
      nstack.push(dataType + '(' + args.join(', ') + ')');
    } else if (type === IEXPR) {
      nstack.push('(' + expressionToGlslString(item.value) + ')');
    } else if (type === IENDSTATEMENT) {
      // eslint-disable no-empty
    } else {
      throw new Error('invalid Expression');
    }
  }
  if (nstack.length > 1) {
    nstack = [nstack.join(',')];
  }
  return String(nstack[0]);
}

function escapeValue(v) {
  if (typeof v === 'string') {
    return JSON.stringify(v).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  }
  return v;
}
