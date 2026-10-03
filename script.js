const { useState, useEffect } = React;

// transforma o código do clima da API em texto 
function interpretarClima(codigo) {
  if (codigo === 0) return { texto: "Céu limpo", emoji: "☀️" };
  if (codigo <= 2) return { texto: "Parcialmente nublado", emoji: "⛅" };
  if (codigo === 3) return { texto: "Nublado", emoji: "☁️" };
  if (codigo === 45 || codigo === 48) return { texto: "Neblina", emoji: "🌫️" };
  if (codigo >= 51 && codigo <= 57) return { texto: "Garoa", emoji: "🌦️" };
  if (codigo >= 61 && codigo <= 67) return { texto: "Chuva", emoji: "🌧️" };
  if (codigo >= 71 && codigo <= 77) return { texto: "Neve", emoji: "❄️" };
  if (codigo >= 80 && codigo <= 82) return { texto: "Pancadas de chuva", emoji: "🌧️" };
  if (codigo >= 95) return { texto: "Tempestade", emoji: "⛈️" };
  return { texto: "Tempo instável", emoji: "🌡️" };
}

function App() {
  const [cidadeDigitada, setCidadeDigitada] = useState("");
  const [cidade, setCidade] = useState(null); // cidade que está na tela
  const [clima, setClima] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  // "banco de dados": as cidades favoritas ficam salvas no localStorage
  const [favoritas, setFavoritas] = useState(() => {
    const salvas = localStorage.getItem("cidadesFavoritas");
    return salvas ? JSON.parse(salvas) : [];
  });

  // sempre que a lista de favoritas mudar, salva de novo
  useEffect(() => {
    localStorage.setItem("cidadesFavoritas", JSON.stringify(favoritas));
  }, [favoritas]);

  // quando abre a página, carrega a primeira favorita (se tiver)
  useEffect(() => {
    if (favoritas.length > 0) {
      carregarClima(favoritas[0]);
    }
  }, []);

  // busca o clima de uma cidade (que já tem latitude e longitude)
  function carregarClima(c) {
    setCarregando(true);
    setErro("");

    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=" + c.latitude +
      "&longitude=" + c.longitude +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
      "&timezone=auto&forecast_days=5";

    fetch(url)
      .then((resposta) => resposta.json())
      .then((dados) => {
        setCidade(c);
        setClima(dados);
        setCarregando(false);
      })
      .catch(() => {
        setErro("Não consegui buscar o clima. Verifique sua internet.");
        setCarregando(false);
      });
  }

  // primeiro descobre a latitude/longitude pelo nome, depois busca o clima
  function pesquisarCidade(event) {
    event.preventDefault();

    if (cidadeDigitada.trim() === "") return;

    setCarregando(true);
    setErro("");

    const url =
      "https://geocoding-api.open-meteo.com/v1/search?name=" +
      encodeURIComponent(cidadeDigitada) + "&count=1&language=pt";

    fetch(url)
      .then((resposta) => resposta.json())
      .then((dados) => {
        if (!dados.results) {
          setErro("Cidade não encontrada. Tente outro nome.");
          setCarregando(false);
          return;
        }

        const resultado = dados.results[0];
        carregarClima({
          id: resultado.id,
          nome: resultado.name,
          estado: resultado.admin1 || "",
          pais: resultado.country || "",
          latitude: resultado.latitude,
          longitude: resultado.longitude
        });
        setCidadeDigitada("");
      })
      .catch(() => {
        setErro("Erro ao pesquisar a cidade.");
        setCarregando(false);
      });
  }

  function salvarFavorita() {
    if (favoritas.some((f) => f.id === cidade.id)) return;
    setFavoritas([...favoritas, cidade]);
  }

  function removerFavorita(id) {
    setFavoritas(favoritas.filter((f) => f.id !== id));
  }

  const jaEhFavorita = cidade && favoritas.some((f) => f.id === cidade.id);

  return (
    <div>
      <header>
        <h1>ClimaCity</h1>
        <p>Veja o clima da sua cidade e salve suas favoritas</p>
      </header>

      <main className="container">
        <form onSubmit={pesquisarCidade}>
          <input
            type="text"
            placeholder="Digite o nome de uma cidade..."
            value={cidadeDigitada}
            onChange={(e) => setCidadeDigitada(e.target.value)}
          />
          <button type="submit">Pesquisar</button>
        </form>

        <section className="favoritos">
          <h3>Cidades favoritas</h3>
          <div className="lista-fav">
            {favoritas.length === 0 && (
              <p className="sem-fav">Nenhuma cidade salva ainda.</p>
            )}
            {favoritas.map((f) => (
              <div className="fav" key={f.id}>
                <button className="nome" onClick={() => carregarClima(f)}>
                  {f.nome}
                </button>
                <button
                  className="remover"
                  onClick={() => removerFavorita(f.id)}
                  aria-label="Remover favorita"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        {erro && <p className="erro">{erro}</p>}
        {carregando && <p className="mensagem">Carregando...</p>}

        {!carregando && !clima && !erro && (
          <p className="mensagem">Pesquise uma cidade para ver o clima. 🌎</p>
        )}

        {!carregando && clima && cidade && (
          <div>
            <section className="atual">
              <div className="atual-topo">
                <div>
                  <h2>{cidade.nome}</h2>
                  <p>{cidade.estado}{cidade.estado && ", "}{cidade.pais}</p>
                </div>

                <button
                  className="btn-salvar"
                  onClick={salvarFavorita}
                  disabled={jaEhFavorita}
                >
                  {jaEhFavorita ? "⭐ Já está nas favoritas" : "⭐ Salvar cidade"}
                </button>
              </div>

              <div className="atual-meio">
                <span className="emoji">
                  {interpretarClima(clima.current.weather_code).emoji}
                </span>
                <div>
                  <div className="temp">{Math.round(clima.current.temperature_2m)}°C</div>
                  <p className="descricao">
                    {interpretarClima(clima.current.weather_code).texto}
                  </p>
                </div>
              </div>

              <div className="detalhes">
                <div>
                  <span>Sensação térmica</span>
                  <strong>{Math.round(clima.current.apparent_temperature)}°C</strong>
                </div>
                <div>
                  <span>Umidade</span>
                  <strong>{clima.current.relative_humidity_2m}%</strong>
                </div>
                <div>
                  <span>Vento</span>
                  <strong>{clima.current.wind_speed_10m} km/h</strong>
                </div>
              </div>
            </section>

            <section className="previsao">
              <h3>Próximos 5 dias</h3>
              <div className="dias">
                {clima.daily.time.map((data, i) => (
                  <div className="dia" key={data}>
                    <p>
                      {new Date(data + "T12:00:00").toLocaleDateString("pt-BR", {
                        weekday: "short"
                      })}
                    </p>
                    <div className="emoji-dia">
                      {interpretarClima(clima.daily.weather_code[i]).emoji}
                    </div>
                    <div className="max">{Math.round(clima.daily.temperature_2m_max[i])}°</div>
                    <div className="min">{Math.round(clima.daily.temperature_2m_min[i])}°</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      <footer>
        <p>Feito por Breno Ryan  • HTML, CSS, JavaScript e React • Dados: Open-Meteo</p>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
