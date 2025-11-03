-- ================================
-- FAUNA KIDS - PostgreSQL Schema
-- Base de Datos Completa
-- ================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- 1. USUARIOS (Con y Sin Correo)
-- ================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificación
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE, -- NULL para usuarios invitados
    display_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255), -- NULL para Google Sign-In o invitados
    avatar_url TEXT,
    
    -- Tipo de cuenta
    account_type VARCHAR(20) DEFAULT 'guest' CHECK (account_type IN ('guest', 'registered', 'google')),
    is_guest BOOLEAN DEFAULT TRUE, -- TRUE = sin historial persistente
    google_id VARCHAR(255) UNIQUE,
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT email_required_for_registered CHECK (
        (is_guest = TRUE AND email IS NULL) OR 
        (is_guest = FALSE AND email IS NOT NULL)
    )
);

CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_is_guest ON users(is_guest);
CREATE INDEX idx_users_account_type ON users(account_type);

-- ================================
-- 2. CONFIGURACIONES DE USUARIO
-- Guardado SOLO para usuarios registrados
-- ================================

CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Apariencia
    theme VARCHAR(50) DEFAULT 'forest', -- forest, ocean, sunset, etc.
    dark_mode BOOLEAN DEFAULT FALSE,
    
    -- Idioma
    language VARCHAR(10) DEFAULT 'es',
    
    -- Preferencias de notificaciones
    email_notifications BOOLEAN DEFAULT TRUE,
    sound_effects BOOLEAN DEFAULT TRUE,
    
    -- Preferencias de privacidad
    profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- ================================
-- 3. HISTORIAL DE CHAT
-- Guardado SOLO para usuarios registrados
-- ================================

CREATE TABLE chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Conversación
    session_id UUID NOT NULL, -- Para agrupar mensajes de una sesión
    message_order INTEGER NOT NULL, -- Orden del mensaje en la conversación
    
    -- Contenido
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content_type VARCHAR(20) DEFAULT 'text' CHECK (content_type IN ('text', 'image')),
    message_text TEXT, -- Mensaje de texto
    image_url TEXT, -- URL de imagen generada
    image_prompt TEXT, -- Prompt usado para generar imagen
    
    -- Contexto
    animal_name VARCHAR(100), -- Animal relacionado (si aplica)
    
    -- Metadata
    gemini_model VARCHAR(50),
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Solo usuarios registrados pueden guardar historial
    CONSTRAINT only_registered_users CHECK (
        user_id IN (SELECT id FROM users WHERE is_guest = FALSE)
    )
);

CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at DESC);
CREATE INDEX idx_chat_history_user_session ON chat_history(user_id, session_id);

-- ================================
-- 4. SESIONES DE CHAT
-- Para organizar conversaciones
-- ================================

CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Información de la sesión
    title VARCHAR(200), -- Auto-generado del primer mensaje
    message_count INTEGER DEFAULT 0,
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT only_registered_users CHECK (
        user_id IN (SELECT id FROM users WHERE is_guest = FALSE)
    )
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_active ON chat_sessions(user_id, is_active);
CREATE INDEX idx_chat_sessions_last_message ON chat_sessions(last_message_at DESC);

-- ================================
-- 5. PROGRESO DEL USUARIO
-- Guardado SOLO para usuarios registrados
-- ================================

CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Estadísticas de exploración
    total_animals_explored INTEGER DEFAULT 0,
    total_questions_asked INTEGER DEFAULT 0,
    total_images_generated INTEGER DEFAULT 0,
    total_chat_sessions INTEGER DEFAULT 0,
    
    -- Racha de actividad
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    last_activity_date DATE,
    
    -- Puntos y nivel (para gamificación futura)
    total_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id),
    
    CONSTRAINT only_registered_users CHECK (
        user_id IN (SELECT id FROM users WHERE is_guest = FALSE)
    )
);

CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_level ON user_progress(current_level);

-- ================================
-- 6. ANIMALES EXPLORADOS
-- Registro de animales consultados
-- ================================

CREATE TABLE animals_explored (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Animal
    animal_name VARCHAR(100) NOT NULL,
    
    -- Estadísticas
    times_explored INTEGER DEFAULT 1,
    first_explored_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_explored_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Favoritos
    is_favorite BOOLEAN DEFAULT FALSE,
    
    UNIQUE(user_id, animal_name),
    
    CONSTRAINT only_registered_users CHECK (
        user_id IN (SELECT id FROM users WHERE is_guest = FALSE)
    )
);

CREATE INDEX idx_animals_explored_user_id ON animals_explored(user_id);
CREATE INDEX idx_animals_explored_favorite ON animals_explored(user_id, is_favorite);
CREATE INDEX idx_animals_explored_recent ON animals_explored(last_explored_at DESC);

-- ================================
-- 7. IMÁGENES GENERADAS
-- Historial de imágenes creadas
-- ================================

CREATE TABLE generated_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    
    -- Imagen
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    animal_name VARCHAR(100),
    
    -- Metadata
    gemini_model VARCHAR(50),
    generation_time_ms INTEGER,
    image_size VARCHAR(20),
    
    -- Favoritos
    is_favorite BOOLEAN DEFAULT FALSE,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT only_registered_users CHECK (
        user_id IN (SELECT id FROM users WHERE is_guest = FALSE)
    )
);

CREATE INDEX idx_generated_images_user_id ON generated_images(user_id);
CREATE INDEX idx_generated_images_session ON generated_images(chat_session_id);
CREATE INDEX idx_generated_images_favorite ON generated_images(user_id, is_favorite);
CREATE INDEX idx_generated_images_created ON generated_images(created_at DESC);

-- ================================
-- 8. LOGROS Y MEDALLAS
-- Sistema de gamificación
-- ================================

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificación
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    
    -- Visual
    icon_emoji VARCHAR(10),
    category VARCHAR(50), -- explorador, coleccionista, constancia, etc.
    
    -- Requisitos
    requirement_type VARCHAR(50) NOT NULL, 
    -- Tipos: animals_explored, questions_asked, images_generated, 
    --        streak_days, chat_sessions, etc.
    requirement_value INTEGER NOT NULL,
    
    -- Recompensas
    points_reward INTEGER DEFAULT 0,
    
    -- Dificultad
    difficulty VARCHAR(20) DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard', 'legendary')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_achievements_code ON achievements(code);
CREATE INDEX idx_achievements_category ON achievements(category);

-- ================================
-- 9. LOGROS DESBLOQUEADOS
-- ================================

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    
    -- Progreso
    current_progress INTEGER DEFAULT 0,
    required_progress INTEGER NOT NULL,
    is_unlocked BOOLEAN DEFAULT FALSE,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, achievement_id),
    
    CONSTRAINT only_registered_users CHECK (
        user_id IN (SELECT id FROM users WHERE is_guest = FALSE)
    )
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(user_id, is_unlocked);

-- ================================
-- 10. SESIONES TEMPORALES (Invitados)
-- Para rastrear sesiones sin persistencia
-- ================================

CREATE TABLE guest_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificación temporal
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_nickname VARCHAR(50) NOT NULL,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    
    -- TTL - Auto-eliminar después de 24 horas
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_guest_sessions_token ON guest_sessions(session_token);
CREATE INDEX idx_guest_sessions_expires ON guest_sessions(expires_at);

-- ================================
-- TRIGGERS Y FUNCIONES
-- ================================

-- 1. Auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at 
    BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at 
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Auto-crear configuraciones y progreso al registrar usuario
CREATE OR REPLACE FUNCTION create_user_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo para usuarios registrados
    IF NEW.is_guest = FALSE THEN
        -- Crear configuraciones por defecto
        INSERT INTO user_settings (user_id) 
        VALUES (NEW.id);
        
        -- Crear progreso inicial
        INSERT INTO user_progress (user_id) 
        VALUES (NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_data 
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_data();

-- 3. Actualizar contador de mensajes en sesión
CREATE OR REPLACE FUNCTION update_chat_session_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions
    SET 
        message_count = message_count + 1,
        last_message_at = NEW.created_at
    WHERE id = NEW.session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_session_stats
    AFTER INSERT ON chat_history
    FOR EACH ROW EXECUTE FUNCTION update_chat_session_stats();

-- 4. Limpiar sesiones de invitados expiradas (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_guest_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM guest_sessions
    WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 5. Actualizar progreso cuando se explora animal
CREATE OR REPLACE FUNCTION update_animal_exploration_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar o crear registro en animals_explored
    INSERT INTO animals_explored (user_id, animal_name, times_explored, last_explored_at)
    VALUES (NEW.user_id, NEW.animal_name, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, animal_name) 
    DO UPDATE SET
        times_explored = animals_explored.times_explored + 1,
        last_explored_at = CURRENT_TIMESTAMP;
    
    -- Actualizar progreso general
    UPDATE user_progress
    SET 
        total_animals_explored = (
            SELECT COUNT(DISTINCT animal_name) 
            FROM animals_explored 
            WHERE user_id = NEW.user_id
        ),
        last_activity_date = CURRENT_DATE
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_animal_stats
    AFTER INSERT OR UPDATE ON animals_explored
    FOR EACH ROW EXECUTE FUNCTION update_animal_exploration_stats();

-- ================================
-- DATOS INICIALES (Seeds)
-- ================================

-- Logros básicos
INSERT INTO achievements (code, name, description, icon_emoji, category, requirement_type, requirement_value, points_reward, difficulty) VALUES
-- Explorador
('first_question', 'Primera Pregunta', 'Haz tu primera pregunta sobre un animal', '❓', 'explorador', 'questions_asked', 1, 10, 'easy'),
('curious_mind', 'Mente Curiosa', 'Haz 10 preguntas', '🤔', 'explorador', 'questions_asked', 10, 50, 'easy'),
('expert_explorer', 'Explorador Experto', 'Haz 100 preguntas', '🎓', 'explorador', 'questions_asked', 100, 200, 'medium'),

-- Coleccionista
('first_discovery', 'Primer Descubrimiento', 'Explora tu primer animal', '🐾', 'coleccionista', 'animals_explored', 1, 10, 'easy'),
('animal_fan', 'Fanático de Animales', 'Explora 10 animales diferentes', '🦁', 'coleccionista', 'animals_explored', 10, 50, 'easy'),
('wildlife_master', 'Maestro de Fauna', 'Explora 50 animales diferentes', '🌍', 'coleccionista', 'animals_explored', 50, 200, 'hard'),

-- Artista
('first_image', 'Primera Imagen', 'Genera tu primera imagen', '🎨', 'artista', 'images_generated', 1, 15, 'easy'),
('image_creator', 'Creador de Imágenes', 'Genera 20 imágenes', '🖼️', 'artista', 'images_generated', 20, 100, 'medium'),

-- Constancia
('three_day_streak', 'Racha de 3 Días', 'Mantén una racha de 3 días', '🔥', 'constancia', 'streak_days', 3, 50, 'easy'),
('week_warrior', 'Guerrero Semanal', 'Mantén una racha de 7 días', '⭐', 'constancia', 'streak_days', 7, 150, 'medium'),
('month_champion', 'Campeón Mensual', 'Mantén una racha de 30 días', '👑', 'constancia', 'streak_days', 30, 500, 'legendary');

-- ================================
-- VISTAS ÚTILES
-- ================================

-- Vista: Historial completo de chat con detalles
CREATE VIEW v_chat_full_history AS
SELECT 
    ch.id,
    ch.session_id,
    cs.title AS session_title,
    ch.user_id,
    u.display_name,
    ch.message_order,
    ch.role,
    ch.content_type,
    ch.message_text,
    ch.image_url,
    ch.animal_name,
    ch.created_at
FROM chat_history ch
JOIN chat_sessions cs ON ch.session_id = cs.id
JOIN users u ON ch.user_id = u.id
ORDER BY ch.created_at DESC;

-- Vista: Resumen de progreso del usuario
CREATE VIEW v_user_progress_summary AS
SELECT 
    u.id AS user_id,
    u.display_name,
    u.email,
    u.account_type,
    up.total_animals_explored,
    up.total_questions_asked,
    up.total_images_generated,
    up.current_streak_days,
    up.longest_streak_days,
    up.total_points,
    up.current_level,
    COUNT(DISTINCT ua.achievement_id) FILTER (WHERE ua.is_unlocked) AS achievements_unlocked,
    up.last_activity_date
FROM users u
LEFT JOIN user_progress up ON u.id = up.user_id
LEFT JOIN user_achievements ua ON u.id = ua.user_id
WHERE u.is_guest = FALSE
GROUP BY u.id, u.display_name, u.email, u.account_type, 
         up.total_animals_explored, up.total_questions_asked, 
         up.total_images_generated, up.current_streak_days, 
         up.longest_streak_days, up.total_points, up.current_level, 
         up.last_activity_date;

-- Vista: Animales más explorados
CREATE VIEW v_popular_animals AS
SELECT 
    animal_name,
    COUNT(DISTINCT user_id) AS unique_users,
    SUM(times_explored) AS total_explorations,
    MAX(last_explored_at) AS last_explored
FROM animals_explored
GROUP BY animal_name
ORDER BY total_explorations DESC;

-- ================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ================================

COMMENT ON TABLE users IS 'Usuarios del sistema: registrados (con correo) e invitados (sin correo)';
COMMENT ON TABLE user_settings IS 'Configuraciones personalizadas SOLO para usuarios registrados';
COMMENT ON TABLE chat_history IS 'Historial completo de conversaciones SOLO para usuarios registrados';
COMMENT ON TABLE chat_sessions IS 'Agrupación de mensajes en sesiones de chat';
COMMENT ON TABLE user_progress IS 'Estadísticas y progreso del usuario registrado';
COMMENT ON TABLE animals_explored IS 'Registro de animales consultados por usuarios registrados';
COMMENT ON TABLE generated_images IS 'Historial de imágenes generadas SOLO para usuarios registrados';
COMMENT ON TABLE achievements IS 'Catálogo de logros disponibles en la aplicación';
COMMENT ON TABLE user_achievements IS 'Logros desbloqueados por usuarios registrados';
COMMENT ON TABLE guest_sessions IS 'Sesiones temporales para usuarios invitados (TTL 24h)';

COMMENT ON COLUMN users.is_guest IS 'TRUE = usuario invitado sin persistencia, FALSE = usuario registrado con historial';
COMMENT ON COLUMN chat_history.session_id IS 'Agrupa mensajes en una conversación continua';
COMMENT ON COLUMN guest_sessions.expires_at IS 'Las sesiones de invitados se auto-eliminan después de 24 horas';
