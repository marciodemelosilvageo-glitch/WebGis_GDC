const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const stateCode = `
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
`;

code = code.replace(
  '  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);',
  '  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);\n' + stateCode
);

const buttonCode = `
            {/* Toggle Tema Escuro */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
              title={isDarkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            >
              {isDarkMode ? <Sun className="w-5 h-5 sm:w-6 sm:h-6" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
`;

code = code.replace(
  '            {/* Campo de Busca Avançada */}',
  buttonCode + '\n            {/* Campo de Busca Avançada */}'
);

fs.writeFileSync('src/App.tsx', code);
