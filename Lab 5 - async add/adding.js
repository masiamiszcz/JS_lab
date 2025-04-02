const asyncAdd = async (a, b) => {
  if (typeof a !== 'number' || typeof b !== 'number') {
    return Promise.reject('Argumenty muszą mieć typ number!');
  }
  return new Promise((resolve) => {
    setTimeout(() => resolve(a + b), 100);
  });
};

const sumAsync = async (...numbers) => {
  while (numbers.length > 1) {
    const promises = [];
    for (let i = 0; i < numbers.length; i += 2) {
      if (i + 1 < numbers.length) {
        promises.push(asyncAdd(numbers[i], numbers[i + 1]));
      } else {
        promises.push(Promise.resolve(numbers[i]));
      }
    }
    numbers = await Promise.all(promises);
  }
  return numbers[0];
};

const measureExecutionTime = async (fn, ...args) => {
  const start = performance.now();
  const result = await fn(...args);
  const end = performance.now();
  console.log(`Czas wykonania: ${(end - start).toFixed(3)} ms`);
  return result;
};

const numbers = Array.from({ length: 100 }, () => Math.floor(Math.random() * 100));
measureExecutionTime(sumAsync, ...numbers).then(result => {
  console.log(`Wynik sumowania: ${result}`);
  console.log(`Liczba operacji asynchronicznych: ${numbers.length - 1}`);
});
