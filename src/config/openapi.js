const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'API de Biblioteca Digital',
    version: '1.0.0',
    description: 'Backend completo para una plataforma de biblioteca digital con Node.js, Express y PostgreSQL. Sistema de gestión de usuarios, libros y reservas con autenticación JWT y roles.',
    contact: {
      name: 'Soporte API',
      email: 'soporte@biblioteca.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor de desarrollo'
    }
  ],
  tags: [
    { name: 'Usuarios', description: 'Gestión de usuarios y autenticación' },
    { name: 'Libros', description: 'Gestión de libros del catálogo' },
    { name: 'Reservas', description: 'Sistema de reservas de libros' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido al hacer login'
      }
    },
    schemas: {
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Juan Pérez' },
          correo: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
          rol: { type: 'string', enum: ['admin', 'editor', 'usuario'], example: 'usuario' },
          permisos: { type: 'array', items: { type: 'string' }, example: ['listar_libros', 'ver_libros'] },
          activo: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Libro: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          titulo: { type: 'string', example: 'Cien años de soledad' },
          autor: { type: 'string', example: 'Gabriel García Márquez' },
          genero: { type: 'string', example: 'Realismo mágico' },
          fecha_publicacion: { type: 'string', format: 'date', example: '1967-05-30' },
          casa_editorial: { type: 'string', example: 'Editorial Sudamericana' },
          disponible: { type: 'boolean', example: true },
          activo: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Reserva: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          usuario_id: { type: 'integer', example: 1 },
          libro_id: { type: 'integer', example: 1 },
          fecha_reserva: { type: 'string', format: 'date-time', example: '2024-01-15T14:30:00Z', description: 'Fecha en que se hizo la reserva' },
          fecha_entrega_prevista: { type: 'string', format: 'date', example: '2024-02-15', description: 'Fecha máxima para devolver el libro' },
          fecha_entrega_real: { type: 'string', format: 'date-time', example: '2024-02-14T10:00:00Z', nullable: true, description: 'Fecha real de devolución (null si no se ha devuelto)' },
          estado: { type: 'string', enum: ['activa', 'devuelta', 'vencida'], example: 'activa', description: 'Estado actual de la reserva' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Error del servidor' },
          mensaje: { type: 'string', example: 'Descripción del error' }
        }
      }
    }
  },
  paths: {
    '/usuarios/register': {
      post: {
        tags: ['Usuarios'],
        summary: 'Registrar nuevo usuario',
        description: 'Endpoint público para registrar un nuevo usuario. Por defecto se asigna el rol "usuario".',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre', 'correo', 'contraseña'],
                properties: {
                  nombre: { type: 'string', example: 'Juan Pérez' },
                  correo: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
                  contraseña: { type: 'string', minLength: 6, example: '123456' },
                  rol: { type: 'string', enum: ['admin', 'editor', 'usuario'], example: 'usuario' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Usuario registrado exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    mensaje: { type: 'string' },
                    usuario: { $ref: '#/components/schemas/Usuario' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Datos incompletos o correo duplicado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
          }
        }
      }
    },
    '/usuarios/login': {
      post: {
        tags: ['Usuarios'],
        summary: 'Iniciar sesión',
        description: 'Endpoint público para autenticación. Retorna un token JWT válido por 24 horas.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['correo', 'contraseña'],
                properties: {
                  correo: { type: 'string', format: 'email', example: 'admin@biblioteca.com' },
                  contraseña: { type: 'string', example: 'admin123' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    mensaje: { type: 'string' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    usuario: { $ref: '#/components/schemas/Usuario' }
                  }
                }
              }
            }
          },
          '401': { description: 'Credenciales inválidas', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/usuarios/{id}': {
      get: {
        tags: ['Usuarios'],
        summary: 'Obtener usuario por ID',
        description: 'Obtener información de un usuario específico',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID del usuario' }
        ],
        responses: {
          '200': { description: 'Usuario encontrado', content: { 'application/json': { schema: { type: 'object', properties: { usuario: { $ref: '#/components/schemas/Usuario' } } } } } },
          '401': { description: 'No autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Usuario no encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      },
      put: {
        tags: ['Usuarios'],
        summary: 'Modificar usuario',
        description: 'Modificar información del usuario. Solo el mismo usuario o quien tenga permiso "modificar_usuarios".',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  correo: { type: 'string', format: 'email' },
                  contraseña: { type: 'string', minLength: 6 }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Usuario actualizado', content: { 'application/json': { schema: { type: 'object', properties: { mensaje: { type: 'string' }, usuario: { $ref: '#/components/schemas/Usuario' } } } } } },
          '403': { description: 'Sin permiso', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      },
      delete: {
        tags: ['Usuarios'],
        summary: 'Inhabilitar usuario (soft delete)',
        description: 'Marcar usuario como inactivo. Solo el mismo usuario o quien tenga permiso "inhabilitar_usuarios".',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '200': { description: 'Usuario inhabilitado' },
          '403': { description: 'Sin permiso' }
        }
      }
    },
    '/usuarios/{id}/permisos': {
      put: {
        tags: ['Usuarios'],
        summary: 'Actualizar permisos o rol',
        description: 'Actualizar permisos o rol de un usuario. Requiere permiso "administrar_permisos".',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  rol: { type: 'string', enum: ['admin', 'editor', 'usuario'] },
                  permisos: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Permisos actualizados' },
          '403': { description: 'Sin permiso' }
        }
      }
    },
    '/libros': {
      get: {
        tags: ['Libros'],
        summary: 'Listar libros con filtros y paginación',
        description: 'Endpoint público para listar libros. Retorna únicamente el título de los libros. Soporta múltiples filtros y paginación.',
        parameters: [
          { name: 'genero', in: 'query', schema: { type: 'string' }, description: 'Filtrar por género' },
          { name: 'autor', in: 'query', schema: { type: 'string' }, description: 'Filtrar por autor' },
          { name: 'nombre', in: 'query', schema: { type: 'string' }, description: 'Filtrar por título' },
          { name: 'casa_editorial', in: 'query', schema: { type: 'string' }, description: 'Filtrar por editorial' },
          { name: 'fecha_publicacion', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filtrar por fecha (YYYY-MM-DD)' },
          { name: 'disponible', in: 'query', schema: { type: 'boolean' }, description: 'Filtrar por disponibilidad' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Número de página' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 }, description: 'Elementos por página' }
        ],
        responses: {
          '200': {
            description: 'Lista de títulos de libros',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { 
                      type: 'array', 
                      items: { 
                        type: 'object',
                        properties: {
                          titulo: { type: 'string', example: 'Cien años de soledad' }
                        }
                      }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer', example: 50 },
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        totalPages: { type: 'integer', example: 5 },
                        hasNextPage: { type: 'boolean', example: true },
                        hasPrevPage: { type: 'boolean', example: false }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Libros'],
        summary: 'Crear libro',
        description: 'Crear un nuevo libro. Requiere permiso "crear_libros".',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['titulo', 'autor', 'genero'],
                properties: {
                  titulo: { type: 'string', example: 'El Quijote' },
                  autor: { type: 'string', example: 'Miguel de Cervantes' },
                  genero: { type: 'string', example: 'Clásico' },
                  fecha_publicacion: { type: 'string', format: 'date', example: '1605-01-16' },
                  casa_editorial: { type: 'string', example: 'Francisco de Robles' },
                  disponible: { type: 'boolean', default: true }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Libro creado' },
          '403': { description: 'Sin permiso' }
        }
      }
    },
    '/libros/{id}': {
      get: {
        tags: ['Libros'],
        summary: 'Obtener libro por ID',
        description: 'Endpoint público para ver detalles de un libro',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '200': { description: 'Libro encontrado', content: { 'application/json': { schema: { type: 'object', properties: { libro: { $ref: '#/components/schemas/Libro' } } } } } },
          '404': { description: 'Libro no encontrado' }
        }
      },
      put: {
        tags: ['Libros'],
        summary: 'Modificar libro',
        description: 'Actualizar información de un libro. Requiere permiso "modificar_libros".',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  titulo: { type: 'string' },
                  autor: { type: 'string' },
                  genero: { type: 'string' },
                  fecha_publicacion: { type: 'string', format: 'date' },
                  casa_editorial: { type: 'string' },
                  disponible: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Libro actualizado' },
          '403': { description: 'Sin permiso' }
        }
      },
      delete: {
        tags: ['Libros'],
        summary: 'Inhabilitar libro (soft delete)',
        description: 'Marcar libro como inactivo. Requiere permiso "inhabilitar_libros".',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '200': { description: 'Libro inhabilitado' },
          '403': { description: 'Sin permiso' }
        }
      }
    },
    '/reservas': {
      post: {
        tags: ['Reservas'],
        summary: 'Crear reserva',
        description: 'Reservar un libro. Requiere permiso "reservar_libros". La fecha de entrega prevista debe ser futura.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['libro_id', 'fecha_entrega_prevista'],
                properties: {
                  libro_id: { type: 'integer', example: 1, description: 'ID del libro a reservar' },
                  fecha_entrega_prevista: { type: 'string', format: 'date', example: '2024-12-31', description: 'Fecha máxima para devolver el libro (debe ser futura)' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Reserva creada exitosamente' },
          '400': { description: 'Libro no disponible, fecha inválida o datos incompletos' },
          '403': { description: 'Sin permiso reservar_libros' },
          '404': { description: 'Libro no encontrado' }
        }
      }
    },
    '/reservas/usuario': {
      get: {
        tags: ['Reservas'],
        summary: 'Ver mis reservas',
        description: 'Obtener las reservas del usuario autenticado. Por defecto muestra solo activas y vencidas. Requiere permiso "ver_reservas_usuario". Actualiza automáticamente el estado de reservas vencidas.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'incluir_finalizadas', in: 'query', schema: { type: 'boolean' }, description: 'Si es true, incluye reservas devueltas' },
          { name: 'estado', in: 'query', schema: { type: 'string', enum: ['activa', 'devuelta', 'vencida'] }, description: 'Filtrar por estado específico' }
        ],
        responses: {
          '200': {
            description: 'Lista de reservas del usuario',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer', description: 'Número total de reservas' },
                    reservas: { type: 'array', items: { $ref: '#/components/schemas/Reserva' } }
                  }
                }
              }
            }
          },
          '401': { description: 'No autenticado' },
          '403': { description: 'Sin permiso ver_reservas_usuario' }
        }
      }
    },
    '/reservas/libro/{libro_id}': {
      get: {
        tags: ['Reservas'],
        summary: 'Ver reservas de un libro',
        description: 'Obtener todas las reservas de un libro específico. Requiere permiso "ver_reservas_libro".',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'libro_id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '200': { description: 'Lista de reservas del libro' },
          '403': { description: 'Sin permiso' }
        }
      }
    },
    '/reservas/{id}': {
      delete: {
        tags: ['Reservas'],
        summary: 'Devolver libro',
        description: 'Devolver un libro prestado. Marca la fecha_entrega_real, cambia el estado a "devuelta" y libera el libro. Indica si la entrega fue tardía. El usuario puede devolver sus propias reservas o un admin puede devolver cualquiera.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID de la reserva' }
        ],
        responses: {
          '200': { 
            description: 'Libro devuelto exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    mensaje: { type: 'string', example: 'Reserva devuelta exitosamente' },
                    entrega_tardia: { type: 'boolean', description: 'True si se devolvió después de fecha_entrega_prevista' },
                    reserva: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        fecha_reserva: { type: 'string', format: 'date-time' },
                        fecha_entrega_prevista: { type: 'string', format: 'date' },
                        fecha_entrega_real: { type: 'string', format: 'date-time' },
                        estado: { type: 'string', example: 'devuelta' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': { description: 'Reserva ya devuelta' },
          '403': { description: 'Sin permiso para devolver esta reserva' },
          '404': { description: 'Reserva no encontrada' }
        }
      }
    }
  }
};

module.exports = openApiSpec;

