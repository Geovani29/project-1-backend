# Biblioteca Digital - Backend API

Backend completo para una plataforma de biblioteca digital desarrollado con Node.js, Express y PostgreSQL, utilizando Sequelize ORM. Este proyecto implementa un sistema completo de gestión de usuarios, libros y reservas con autenticación JWT y sistema de roles y permisos.

## Características Principales

- Autenticación con JWT
- Encriptación de contraseñas con bcrypt
- Sistema de roles (admin, editor, usuario)
- Sistema de permisos granular
- Soft delete (eliminación lógica)
- Paginación y filtros avanzados
- Arquitectura MVC
- Variables de entorno con dotenv
- Documentación interactiva con Scalar API

## Requisitos Previos

- Node.js (v14 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

## Instalación

### 1. Clonar el repositorio
```bash
cd biblioteca-digital-backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=biblioteca_digital
DB_USER=postgres
DB_PASS=tu_contraseña

# Configuración JWT
JWT_SECRET=tu_contraseña_secreta

# Configuración del Servidor
PORT=3000
NODE_ENV=development
```

### 4. Crear la base de datos

Accede a PostgreSQL y crea la base de datos:

```sql
CREATE DATABASE biblioteca_digital;
```

### 5. Iniciar el servidor

```bash
npm start
```

O para desarrollo con reinicio automático:

```bash
npm run dev
```

### 6. Crear usuario administrador inicial

Ejecuta el script de inicialización:

```bash
npm run init-admin
```

Esto creará un usuario administrador con las siguientes credenciales:
- **Correo:** admin@biblioteca.com
- **Contraseña:** admin123

**IMPORTANTE:** Cambia la contraseña después del primer login.

## Documentación Interactiva

Una vez iniciado el servidor, puedes acceder a la documentación interactiva en:

```
http://localhost:3000/api/docs
```

Esta interfaz te permite probar todos los endpoints directamente desde el navegador.

## Estructura del Proyecto

```
/src
├── config/
│   └── db.js                 # Configuración de Sequelize
├── controllers/
│   ├── usuarioController.js  # Controlador de usuarios
│   ├── libroController.js    # Controlador de libros
│   └── reservaController.js  # Controlador de reservas
├── models/
│   ├── Usuario.js            # Modelo de Usuario
│   ├── Libro.js              # Modelo de Libro
│   ├── Reserva.js            # Modelo de Reserva
│   └── index.js              # Relaciones entre modelos
├── routes/
│   ├── usuarioRoutes.js      # Rutas de usuarios
│   ├── libroRoutes.js        # Rutas de libros
│   └── reservaRoutes.js      # Rutas de reservas
├── middlewares/
│   ├── authMiddleware.js     # Middleware de autenticación
│   ├── checkPermissions.js   # Middleware de permisos
│   └── checkRole.js          # Middleware de roles
├── utils/
│   └── pagination.js         # Utilidades de paginación
├── scripts/
│   └── initAdmin.js          # Script de inicialización
├── app.js                    # Configuración de Express
└── server.js                 # Punto de entrada
```

## Modelos

### Usuario
- `id`: Autoincremental
- `nombre`: String
- `correo`: String (único)
- `contraseña`: String (encriptada)
- `rol`: Enum (admin, editor, usuario)
- `permisos`: JSONB (array de permisos)
- `activo`: Boolean

### Libro
- `id`: Autoincremental
- `titulo`: String
- `autor`: String
- `genero`: String
- `fecha_publicacion`: Date
- `casa_editorial`: String
- `disponible`: Boolean
- `activo`: Boolean

### Reserva
- `id`: Autoincremental
- `usuario_id`: FK → Usuario
- `libro_id`: FK → Libro
- `fecha_reserva`: Date
- `fecha_entrega`: Date

## Roles y Permisos

### Rol: admin
Control total del sistema.

**Permisos:**
- `crear_usuarios`, `modificar_usuarios`, `inhabilitar_usuarios`, `ver_usuarios`, `administrar_permisos`
- `crear_libros`, `modificar_libros`, `inhabilitar_libros`, `ver_libros`, `listar_libros`
- `reservar_libros`, `ver_reservas_usuario`, `ver_reservas_libro`, `cancelar_reservas`

### Rol: editor
Gestiona libros, pero no usuarios.

**Permisos:**
- `crear_libros`, `modificar_libros`, `inhabilitar_libros`, `ver_libros`, `listar_libros`

### Rol: usuario
Puede ver y reservar libros.

**Permisos:**
- `listar_libros`, `ver_libros`, `reservar_libros`, `ver_reservas_usuario`

## API Endpoints

### Usuarios

#### Registro de usuario (público)
```http
POST /usuarios/register
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "correo": "juan@ejemplo.com",
  "contraseña": "123456",
  "rol": "usuario"
}
```

#### Login (público)
```http
POST /usuarios/login
Content-Type: application/json

{
  "correo": "juan@ejemplo.com",
  "contraseña": "123456"
}
```

**Respuesta:**
```json
{
  "mensaje": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nombre": "Juan Pérez",
    "correo": "juan@ejemplo.com",
    "rol": "usuario",
    "permisos": ["listar_libros", "ver_libros", "reservar_libros", "ver_reservas_usuario"]
  }
}
```

#### Ver información de usuario
```http
GET /usuarios/:id
Authorization: Bearer {token}
```

#### Modificar usuario
```http
PUT /usuarios/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Juan Carlos Pérez",
  "correo": "juancarlos@ejemplo.com"
}
```

#### Actualizar permisos o rol
```http
PUT /usuarios/:id/permisos
Authorization: Bearer {token}
Content-Type: application/json

{
  "rol": "editor",
  "permisos": ["crear_libros", "modificar_libros"]
}
```

#### Inhabilitar usuario (soft delete)
```http
DELETE /usuarios/:id
Authorization: Bearer {token}
```

### Libros

#### Listar libros con filtros y paginación (público)
```http
GET /libros?genero=Ficción&autor=García&nombre=Cien&disponible=true&page=1&limit=10
```

**Parámetros de query opcionales:**
- `genero`: Filtrar por género
- `autor`: Filtrar por autor
- `nombre`: Filtrar por título
- `casa_editorial`: Filtrar por editorial
- `fecha_publicacion`: Filtrar por fecha (YYYY-MM-DD)
- `disponible`: Filtrar por disponibilidad (true/false)
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10, max: 100)

**Respuesta:**
```json
{
  "data": [
    {
      "id": 1,
      "titulo": "Cien años de soledad",
      "autor": "Gabriel García Márquez",
      "genero": "Ficción",
      "fecha_publicacion": "1967-05-30",
      "casa_editorial": "Sudamericana",
      "disponible": true,
      "activo": true
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### Ver libro por ID (público)
```http
GET /libros/:id
```

#### Crear libro
```http
POST /libros
Authorization: Bearer {token}
Content-Type: application/json

{
  "titulo": "El Quijote",
  "autor": "Miguel de Cervantes",
  "genero": "Clásico",
  "fecha_publicacion": "1605-01-16",
  "casa_editorial": "Francisco de Robles",
  "disponible": true
}
```

#### Modificar libro
```http
PUT /libros/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "disponible": false
}
```

#### Inhabilitar libro (soft delete)
```http
DELETE /libros/:id
Authorization: Bearer {token}
```

### Reservas

#### Crear reserva
```http
POST /reservas
Authorization: Bearer {token}
Content-Type: application/json

{
  "libro_id": 1,
  "fecha_entrega": "2024-12-31"
}
```

#### Ver mis reservas
```http
GET /reservas/usuario
Authorization: Bearer {token}
```

#### Ver reservas de un libro
```http
GET /reservas/libro/:libro_id
Authorization: Bearer {token}
```

#### Cancelar/finalizar reserva
```http
DELETE /reservas/:id
Authorization: Bearer {token}
```

## Autenticación

Todas las rutas protegidas requieren un token JWT en el header de autorización:

```http
Authorization: Bearer {tu_token_jwt}
```

El token se obtiene al hacer login y tiene una duración de 24 horas.

## Ejemplos de Uso

### 1. Registro y Login
```bash
# Registrar un nuevo usuario
curl -X POST http://localhost:3000/usuarios/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Ana López",
    "correo": "ana@ejemplo.com",
    "contraseña": "123456"
  }'

# Login
curl -X POST http://localhost:3000/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "ana@ejemplo.com",
    "contraseña": "123456"
  }'
```

### 2. Crear un libro (requiere rol editor o admin)
```bash
curl -X POST http://localhost:3000/libros \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "titulo": "1984",
    "autor": "George Orwell",
    "genero": "Distopía",
    "fecha_publicacion": "1949-06-08",
    "casa_editorial": "Secker & Warburg"
  }'
```

### 3. Listar libros con filtros
```bash
curl "http://localhost:3000/libros?genero=Distopía&disponible=true&page=1&limit=5"
```

### 4. Reservar un libro
```bash
curl -X POST http://localhost:3000/reservas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "libro_id": 1
  }'
```

## Características Implementadas

### Rúbrica Completa

- [x] CREATE User (registro público)
- [x] CREATE Libro + Autenticación
- [x] READ User + Autenticación
- [x] READ Libro (público)
- [x] READ Libros + Filtros + Paginación
- [x] UPDATE User + Autenticación
- [x] UPDATE Libro + Autenticación
- [x] DELETE (Soft Delete) en usuarios y libros
- [x] Roles y permisos correctamente implementados
- [x] Sin secretos expuestos (uso de .env)

### Seguridad

- Contraseñas encriptadas con bcrypt
- Autenticación JWT
- Middleware de verificación de permisos
- Validación de datos de entrada
- Protección contra correos duplicados
- Soft delete para mantener integridad de datos

### Funcionalidades Adicionales

- Sistema de reservas completo
- Gestión automática de disponibilidad de libros
- Paginación eficiente
- Filtros múltiples para búsqueda de libros
- Relaciones entre modelos (Usuario-Reserva-Libro)
- Respuestas consistentes con mensajes en español

## Solución de Problemas

### Error de conexión a PostgreSQL
Verifica que:
- PostgreSQL esté ejecutándose
- Las credenciales en `.env` sean correctas
- La base de datos `biblioteca_digital` exista

### Error "Token inválido"
- Verifica que el token esté en el formato: `Bearer {token}`
- El token podría haber expirado (duración: 24h)
- Haz login nuevamente para obtener un nuevo token

### Error de permisos
- Verifica que tu usuario tenga los permisos necesarios
- Los permisos se asignan automáticamente según el rol
- Un admin puede modificar permisos con el endpoint `/usuarios/:id/permisos`

## Notas de Desarrollo

- Los registros "eliminados" se marcan como `activo: false` (soft delete)
- Los endpoints GET excluyen automáticamente los registros inactivos
- La paginación tiene un límite máximo de 100 elementos por página
- Los filtros de búsqueda no distinguen entre mayúsculas y minúsculas
- Las reservas marcan automáticamente los libros como no disponibles

## Autor

Proyecto desarrollado como trabajo individual para el curso de Desarrollo Web Backend.

## Licencia

ISC
