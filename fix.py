import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Main header block
content = content.replace(
"""      {/* QUADRO PRINCIPAL / CONTAINERS EM BLOCOS EMPILHADOS */}
      <main className="w-full space-y-4 sm:space-y-6 z-10 relative">
        
        {/* BLOCO: CABEÇALHO E BUSCA */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, margin: "-5%" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full bg-white rounded-2xl shadow-2xl p-4 sm:p-6 border border-white/50 relative z-20"
        >""",
"""      {/* QUADRO PRINCIPAL */}
      <main className="w-full bg-white rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 z-10 border border-white/50">
        
        {/* CABEÇALHO E BUSCA */}""")

content = content.replace(
"""                className="w-full bg-white rounded-2xl border border-indigo-100 shadow-xl p-4 space-y-3 mt-4 z-30 relative"
              >""",
"""                className="w-full bg-white rounded-2xl border border-indigo-100 shadow-xl p-4 space-y-3 z-30 relative"
              >""")

# 2. End of Header block and Map Component
content = content.replace(
"""              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* BLOCO: MAPA INTERATIVO PRINCIPAL */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, margin: "-5%" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full bg-white rounded-2xl shadow-2xl p-4 sm:p-6 border border-white/50 relative z-10"
        >""",
"""              </motion.div>
            )}
          </AnimatePresence>

        {/* MAPA INTERATIVO PRINCIPAL */}""")

# 3. End of Map Component and Dashboard
content = content.replace(
"""            searchCoordinate={searchCoordinate}
          />
        </motion.div>

        {/* BLOCO: PAINEL DASHBOARD (RAIO-X POPULACIONAL) */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, margin: "-5%" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full relative z-10"
        >""",
"""            searchCoordinate={searchCoordinate}
          />

        {/* PAINEL DASHBOARD (RAIO-X POPULACIONAL) */}""")


# 4. End of Dashboard and Selected Features
content = content.replace(
"""        </motion.div>

        {/* FEIÇÕES SELECIONADAS (LISTAGEM DE SELEÇÃO ATUAL COM LIMPEZA E ZOOM) */}
        <AnimatePresence>
          {selectedFeatures.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', y: 0, scale: 1 }}
              exit={{ opacity: 0, height: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              id="selected-features-container" 
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-xl p-4 overflow-hidden relative z-10"
            >""",
"""
        {/* FEIÇÕES SELECIONADAS (LISTAGEM DE SELEÇÃO ATUAL COM LIMPEZA E ZOOM) */}
        <AnimatePresence>
          {selectedFeatures.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              id="selected-features-container" 
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-xl p-4 overflow-hidden"
            >""")

# 5. End of Selected Features and Property Table
content = content.replace(
"""              </motion.div>
            )}
          </AnimatePresence>

        {/* BLOCO: TABELA DE PROPRIEDADES E EXPORTAÇÃO */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, margin: "-5%" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full relative z-10"
        >""",
"""              </motion.div>
            )}
          </AnimatePresence>

        {/* TABELA DE PROPRIEDADES E EXPORTAÇÃO */}""")

# 6. End of Property Table and Footer
content = content.replace(
"""        </motion.div>

      </main>

      {/* BLOCO: RODAPÉ E PARCEIROS */}
      <motion.footer 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: false, margin: "-5%" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full mt-2 text-center pb-4 select-none z-10 relative"
      >""",
"""
      </main>

      {/* RODAPÉ E PARCEIROS */}
      <footer className="w-full mt-2 text-center pb-4 select-none z-10">""")

# 7. End of Footer
content = content.replace(
"""        </div>
      </motion.footer>""",
"""        </div>
      </footer>""")


with open('src/App.tsx', 'w') as f:
    f.write(content)

