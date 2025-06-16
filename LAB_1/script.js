const calculator = document.querySelector('#calculator');
const addBtn = document.querySelector('#addField');
const calcBtn = document.querySelector('#calculate');

    let fieldCount = 0;

    function createField() {
      const wrapper = document.createElement('div');
      wrapper.className = 'field-wrapper';
      wrapper.dataset.index = fieldCount;

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove-button';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {

        const prev = wrapper.previousElementSibling;
        if (prev && prev.classList.contains('operator-select')) {
          prev.remove();
        } else {
          const next = wrapper.nextElementSibling;
          if (next && next.classList.contains('operator-select')) {
            next.remove();
          }
        }
        wrapper.remove();
        fieldCount--;
      });
      wrapper.appendChild(removeBtn);

      if (fieldCount > 0) {
        const select = document.createElement('select');
        select.className = 'operator-select';
        ['+', '-', '*', '/'].forEach(op => {
          const option = document.createElement('option');
          option.value = op;
          option.textContent = op;
          select.appendChild(option);
        });
        calculator.insertBefore(select, addBtn);
      }

      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'value-input';
      input.value = 0;
      wrapper.appendChild(input);

      calculator.insertBefore(wrapper, addBtn);
      fieldCount++;
    }

    addBtn.addEventListener('click', () => createField());

    createField();
    createField();
    createField();

    calcBtn.addEventListener('click', () => {
      const inputs = Array.from(calculator.querySelectorAll('.value-input')).map(i => parseFloat(i.value) || 0);
      const ops = Array.from(calculator.querySelectorAll('.operator-select')).map(s => s.value);

      for (let i = 0; i < ops.length; i++) {
        if (ops[i] === '/' && inputs[i + 1] === 0) {
          alert('NIE DZIEL PRZEZ 0!');
          return;
        }
      }

      let expression = inputs[0].toString();
      for (let i = 1; i < inputs.length; i++) {
        expression += `${ops[i - 1]}${inputs[i]}`;
      }

      let exprResult;
      try {
        exprResult = eval(expression);
      } catch (e) {
        alert('Błąd w wyrażeniu!');
        return;
      }

      const sum = inputs.reduce((a, b) => a + b, 0);
      const avg = inputs.length ? sum / inputs.length : 0;
      const min = Math.min(...inputs);
      const max = Math.max(...inputs);

      alert(
        `Wyrażenie: ${expression}\n` +
        `Wynik: ${exprResult}\n` +
        `\n` +
        `Średnia: ${avg}\n` +
        `Min: ${min}\n` +
        `Max: ${max}`
      );
    });