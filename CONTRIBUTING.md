# 🤝 Guía de Contribución - Fauna Kids

Gracias por tu interés en contribuir a Fauna Kids. Esta guía te ayudará a participar en el proyecto.

---

## 📋 Tabla de Contenidos

1. [Código de Conducta](#código-de-conducta)
2. [¿Cómo Puedo Contribuir?](#cómo-puedo-contribuir)
3. [Configuración del Entorno](#configuración-del-entorno)
4. [Flujo de Trabajo](#flujo-de-trabajo)
5. [Estándares de Código](#estándares-de-código)
6. [Proceso de Review](#proceso-de-review)

---

## 🌟 Código de Conducta

Este proyecto sigue un código de conducta para asegurar un ambiente inclusivo y respetuoso:

- 🤝 Sé respetuoso y profesional
- 💬 Acepta críticas constructivas
- 🎯 Enfócate en lo mejor para el proyecto
- 🌈 Sé inclusivo con todos los participantes

---

## 🚀 ¿Cómo Puedo Contribuir?

### Reportar Bugs

Si encuentras un bug:

1. Verifica que no esté reportado en [Issues](https://github.com/tu-usuario/fauna-kids/issues)
2. Crea un nuevo issue con:
   - Título descriptivo
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots si es posible
   - Información del sistema (OS, navegador, versiones)

### Sugerir Funcionalidades

Para sugerir nuevas funcionalidades:

1. Revisa [Issues](https://github.com/tu-usuario/fauna-kids/issues) para evitar duplicados
2. Crea un nuevo issue con:
   - Descripción clara de la funcionalidad
   - Justificación (¿por qué es útil?)
   - Mockups o ejemplos si es posible

### Pull Requests

¡Las pull requests son bienvenidas! Para contribuir con código:

1. Fork el repositorio
2. Crea una rama desde `main`
3. Implementa tus cambios
4. Escribe tests si es posible
5. Actualiza documentación
6. Envía tu pull request

---

## ⚙️ Configuración del Entorno

### Prerrequisitos

- Python 3.13+
- Node.js 18+
- PostgreSQL 14+
- Git

### Setup Completo

```bash
# 1. Fork y clonar
git clone https://github.com/tu-usuario/fauna-kids.git
cd fauna-kids

# 2. Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # o .\.venv\Scripts\activate en Windows
pip install -r requirements.txt
cp .env.example .env
# Editar .env con tus credenciales
python manage.py migrate

# 3. Frontend
cd ../frontend
npm install
cp .env.example .env

# 4. Ejecutar
# Terminal 1 (Backend):
cd backend
python manage.py runserver

# Terminal 2 (Frontend):
cd frontend
npm run dev
```

---

## 🔄 Flujo de Trabajo

### Naming de Ramas

```
feature/nombre-funcionalidad     # Nueva funcionalidad
bugfix/descripcion-bug           # Corrección de bug
hotfix/problema-critico          # Arreglo urgente
docs/actualizacion-docs          # Documentación
refactor/mejora-codigo           # Refactorización
```

### Commits

Usa mensajes descriptivos con prefijos:

```
feat: Agregar generación de imágenes con contexto
fix: Corregir extracción de animal en prompts
docs: Actualizar README con nueva estructura
style: Mejorar formato de código en views.py
refactor: Simplificar lógica de detección de imágenes
test: Agregar tests para chat_views
chore: Actualizar dependencias
```

### Proceso

1. **Crear rama**
   ```bash
   git checkout -b feature/mi-funcionalidad
   ```

2. **Hacer cambios y commits**
   ```bash
   git add .
   git commit -m "feat: Agregar nueva funcionalidad"
   ```

3. **Mantener actualizado**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

4. **Push y PR**
   ```bash
   git push origin feature/mi-funcionalidad
   # Crear Pull Request en GitHub
   ```

---

## 📝 Estándares de Código

### Python (Backend)

- ✅ Seguir [PEP 8](https://pep8.org/)
- ✅ Usar type hints cuando sea posible
- ✅ Docstrings para funciones complejas
- ✅ Máximo 100 caracteres por línea

```python
def extract_animal_name(prompt: str) -> str:
    """
    Extrae el nombre del animal del prompt usando múltiples estrategias.
    
    Args:
        prompt: Texto del usuario y respuesta del asistente
        
    Returns:
        Nombre del animal extraído
    """
    # Implementación...
```

### JavaScript/React (Frontend)

- ✅ ES6+ syntax
- ✅ Functional components con hooks
- ✅ PropTypes o TypeScript
- ✅ Componentes en PascalCase
- ✅ Variables en camelCase

```javascript
function ExplorerChat({ onSend, messages }) {
    const [input, setInput] = useState('')
    
    const handleSubmit = (e) => {
        e.preventDefault()
        if (input.trim()) {
            onSend(input)
            setInput('')
        }
    }
    
    return (/* JSX */)
}
```

### CSS

- ✅ Usar clases descriptivas
- ✅ BEM naming cuando sea apropiado
- ✅ Mobile-first approach
- ✅ Variables CSS para colores y tamaños

```css
.chat-container {
    display: flex;
    flex-direction: column;
}

.chat-container__message--user {
    align-self: flex-end;
}
```

---

## 🔍 Proceso de Review

### Checklist para PRs

Antes de enviar tu PR, verifica:

- [ ] El código sigue los estándares del proyecto
- [ ] Tests pasan (`python manage.py test` / `npm test`)
- [ ] Documentación actualizada
- [ ] Sin conflictos con `main`
- [ ] Commits con mensajes descriptivos
- [ ] Screenshots para cambios visuales

### Qué Esperamos Revisar

Los maintainers revisarán:

1. **Calidad del código**
   - Legibilidad
   - Mantenibilidad
   - Rendimiento

2. **Funcionalidad**
   - Cumple requisitos
   - Sin bugs obvios
   - Edge cases considerados

3. **Tests**
   - Cobertura adecuada
   - Tests pasan

4. **Documentación**
   - Código comentado cuando sea necesario
   - README actualizado si aplica

### Tiempo de Respuesta

- PRs simples: 1-3 días
- PRs complejas: 5-7 días
- Issues: 1-2 días

---

## 🧪 Testing

### Backend Tests

```bash
# Ejecutar todos los tests
python manage.py test

# Test específico
python manage.py test api.tests.test_views

# Con coverage
coverage run --source='.' manage.py test
coverage report
```

### Frontend Tests

```bash
# Ejecutar tests
npm test

# Con cobertura
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 📚 Recursos Útiles

### Documentación

- [Django Docs](https://docs.djangoproject.com/)
- [React Docs](https://react.dev/)
- [Google Gemini API](https://ai.google.dev/docs)
- [Vertex AI Docs](https://cloud.google.com/vertex-ai/docs)

### Herramientas

- [Python Black](https://black.readthedocs.io/) - Code formatter
- [ESLint](https://eslint.org/) - JavaScript linter
- [Prettier](https://prettier.io/) - Code formatter

---

## ❓ Preguntas

Si tienes preguntas:

1. Revisa la [documentación](./docs/)
2. Busca en [Issues](https://github.com/tu-usuario/fauna-kids/issues)
3. Crea un nuevo issue con la etiqueta `question`

---

## 🎉 Reconocimientos

¡Todos los contribuidores serán agregados a la sección de agradecimientos!

---

**Gracias por contribuir a Fauna Kids! 🐆💚**
