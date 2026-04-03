const API_ROOT = "https://www.themealdb.com/api/json/v1/1/";
const API_INGREDIENTS = API_ROOT + "list.php?i=list";
const API_FILTER = API_ROOT + "filter.php?i=";
const API_DETAILS = API_ROOT + "lookup.php?i=";

const $FORM = document.querySelector("#search-form");
const $RESULTADOS = document.querySelector("#resultados");
const $SELECT = $("#ingrediente");
const $TEMPLATE = document.querySelector("#receta-template");
const MSG_FETCH_ERROR = '<div class="col-12"><p class="text-center text-muted">Lo sentimos, hubo un error al obtener la información de la API.</p></div>';
const MSG_NO_RESULTS = '<div class="col-12"><p class="text-center text-muted">Lo sentimos, no se encontraron recetas. Intenta con otro ingrediente.</p></div>';

class Receta {
  constructor({ idMeal: id, strMeal: nombre, strMealThumb: imagen }) {
    Object.assign(this, { id, nombre, imagen });
  }

  async cargarDetalles() {
    const response = await fetch(API_DETAILS + this.id);
    const { meals } = await response.json();
    if (meals && meals[0]) {
      const meal = meals[0];
      this.ingredientes = [];
      this.preparacion = meal.strInstructions;

      for (let i = 1; i <= 20; i++) {
        const ingrediente = meal[`strIngredient${i}`];
        const medida = meal[`strMeasure${i}`];
        if (ingrediente && ingrediente.trim()) {
          this.ingredientes.push(`${medida} ${ingrediente}`.trim());
        }
      }
    }
  }

  toHTML = () => {
    const $CLONE = $TEMPLATE.content.cloneNode(true);
    const checkboxId = `receta-${this.id}`;

    $CLONE.querySelector(".flip-toggle").id = checkboxId;
    $CLONE.querySelector(".btn-ver-receta").setAttribute("for", checkboxId);
    $CLONE.querySelector(".btn-volver").setAttribute("for", checkboxId);
    $CLONE.querySelector(".imagen").src = this.imagen;
    $CLONE.querySelector(".imagen").alt = this.nombre;
    $CLONE.querySelector(".nombre").textContent = this.nombre;

    const checkbox = $CLONE.querySelector(".flip-toggle");
    checkbox.addEventListener("change", async (e) => {
      if (e.target.checked && !this.ingredientes) {
        await this.cargarDetalles();
        const container = e.target.closest(".flip-card-container");
        const listaIngredientes = container.querySelector(".ingredientes-list");
        const preparacionTexto = container.querySelector(".preparacion");

        listaIngredientes.innerHTML = this.ingredientes
          .map((ing) => `<li>${ing}</li>`)
          .join("");
        preparacionTexto.textContent = this.preparacion;
      }
    });

    return $CLONE;
  };
}

(async () => {
  const { meals } = await (await fetch(API_INGREDIENTS)).json();

  $SELECT.select2({
    data: meals.map(m => ({
      id: m.strIngredient,
      text: m.strIngredient,
      ...m
    })),
    placeholder: "Escribe un ingrediente...",
    allowClear: true,
    width: "100%",
    minimumResultsForSearch: 0,
    templateResult: (ingr) => $(`<span><img src="${ingr.strThumb}" class="img-ingr" /> ${ingr.strIngredient} <small>${ingr.strDescription || 'Sin Descripción'}</small></span>`)
  });

  $SELECT.on("select2:select", async () => {
    const ingrediente = $SELECT.val();
    if (!ingrediente) return;

    try {
      const { meals } = await (await fetch(API_FILTER + ingrediente)).json();
      $RESULTADOS.innerHTML = "";

      meals
        ? meals.forEach((meal) =>
            $RESULTADOS.appendChild(new Receta(meal).toHTML())
          )
        : ($RESULTADOS.innerHTML = MSG_NO_RESULTS);
    } catch (err) {
      $RESULTADOS.innerHTML = MSG_FETCH_ERROR;
      console.error("Error:", err);
    }
  });

  $SELECT.on("select2:clear", () => {
    $RESULTADOS.innerHTML = "";
  });
})();
