const btnPrzelicz = document.querySelector('#przelicz');
const wynikiPojemnik = document.querySelector('#wynik');

const znakmap = {
    "plus": "+",
    "minus": "-",
    "razy": "*",
    "dziel": "/"
};

let znak1 = "+"; 
let znak2 = "+"; 
let znak3 = "+"; 

document.getElementById('selector1').addEventListener('change', function () {
    znak1 = znakmap[this.value];
});
document.getElementById('selector2').addEventListener('change', function () {
    znak2 = znakmap[this.value];
});
document.getElementById('selector3').addEventListener('change', function () {
    znak3 = znakmap[this.value];
});

btnPrzelicz.addEventListener('click', () => {
    const liczba1 = parseFloat(document.querySelector('#liczba1').value);
    const liczba2 = parseFloat(document.querySelector('#liczba2').value);
    const liczba3 = parseFloat(document.querySelector('#liczba3').value);
    const liczba4 = parseFloat(document.querySelector('#liczba4').value);
    
    if (isNaN(liczba1) || isNaN(liczba2) || isNaN(liczba3 || isNaN(liczba4))) {
        wynikiPojemnik.textContent = "Podaj poprawne liczby!";
        return;
    }

    if ((znak1 === "/" && liczba2 === 0) || (znak2 === "/" && liczba3 === 0) || (znak3 === "/" && liczba4 === 0)) {
        wynikiPojemnik.textContent = "Nie można dzielić przez 0!";
        return;
    }
    
    const wyrazenie = `${liczba1} ${znak1} ${liczba2} ${znak2} ${liczba3} ${znak3} ${liczba4}`;
    let wynik;
    try{
        wynik = eval(wyrazenie);
        wynikiPojemnik.textContent = "wynik: " + wynik +"\nsrednia: " + (liczba1+liczba2+liczba3+liczba4)/4  +"\nnajmniejsza liczba: " + 
        Math.min(liczba1,liczba2,liczba3,liczba4) + "\nnajwieksza liczba: " + Math.max(liczba1,liczba2,liczba3,liczba4);

    }catch(error){
        wynikiPojemnik.textContent = "błąd!";
    }
});
