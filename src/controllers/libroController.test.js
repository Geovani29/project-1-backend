const {
    createLibro,
    getLibroById,
    getLibros,
    updateLibro,
    deleteLibro
} = require('./libroController');
const { Libro } = require('../models');
const { getPaginationParams, buildPaginationResponse } = require('../utils/pagination');

jest.mock('../models');
jest.mock('../utils/pagination');

describe('libroController', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            query: {},
            user: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe('createLibro', () => {
        it('debe crear un libro exitosamente', async () => {
            req.body = {
                titulo: 'Cien años de soledad',
                autor: 'Gabriel García Márquez',
                genero: 'Realismo mágico',
                fecha_publicacion: '1967-05-30',
                casa_editorial: 'Sudamericana',
                disponible: true
            };

            Libro.create = jest.fn().mockResolvedValue({
                id: 1,
                titulo: 'Cien años de soledad',
                autor: 'Gabriel García Márquez',
                genero: 'Realismo mágico',
                fecha_publicacion: '1967-05-30',
                casa_editorial: 'Sudamericana',
                disponible: true,
                activo: true
            });

            await createLibro(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    mensaje: 'Libro creado exitosamente',
                    libro: expect.objectContaining({
                        titulo: 'Cien años de soledad'
                    })
                })
            );
        });

        it('debe fallar si faltan campos requeridos', async () => {
            req.body = {
                titulo: 'Cien años de soledad'
            };

            await createLibro(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Datos incompletos'
                })
            );
        });
    });

    describe('getLibroById', () => {
        it('debe obtener un libro por ID exitosamente', async () => {
            req.params = { id: '1' };

            const mockLibro = {
                id: 1,
                titulo: 'Cien años de soledad',
                autor: 'Gabriel García Márquez',
                genero: 'Realismo mágico',
                disponible: true,
                activo: true
            };

            Libro.findOne = jest.fn().mockResolvedValue(mockLibro);

            await getLibroById(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    libro: mockLibro
                })
            );
        });

        it('debe fallar si el libro no existe', async () => {
            req.params = { id: '999' };

            Libro.findOne = jest.fn().mockResolvedValue(null);

            await getLibroById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'No encontrado'
                })
            );
        });
    });

    describe('getLibros', () => {
        it('debe listar libros con paginación exitosamente', async () => {
            req.query = {
                page: '1',
                limit: '10'
            };

            getPaginationParams.mockReturnValue({
                offset: 0,
                limit: 10,
                page: 1
            });

            const mockLibros = [
                { titulo: 'Cien años de soledad' },
                { titulo: 'El Quijote' }
            ];

            Libro.findAndCountAll = jest.fn().mockResolvedValue({
                count: 2,
                rows: mockLibros
            });

            buildPaginationResponse.mockReturnValue({
                data: mockLibros,
                pagination: {
                    total: 2,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            });

            await getLibros(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.arrayContaining([
                        expect.objectContaining({ titulo: 'Cien años de soledad' })
                    ]),
                    pagination: expect.any(Object)
                })
            );
        });

        it('debe filtrar libros por género', async () => {
            req.query = {
                genero: 'Ficción',
                page: '1',
                limit: '10'
            };

            getPaginationParams.mockReturnValue({
                offset: 0,
                limit: 10,
                page: 1
            });

            Libro.findAndCountAll = jest.fn().mockResolvedValue({
                count: 1,
                rows: [{ titulo: '1984' }]
            });

            buildPaginationResponse.mockReturnValue({
                data: [{ titulo: '1984' }],
                pagination: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            });

            await getLibros(req, res);

            expect(Libro.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        activo: true
                    })
                })
            );
        });

        it('debe filtrar libros por disponibilidad', async () => {
            req.query = {
                disponible: 'true',
                page: '1',
                limit: '10'
            };

            getPaginationParams.mockReturnValue({
                offset: 0,
                limit: 10,
                page: 1
            });

            Libro.findAndCountAll = jest.fn().mockResolvedValue({
                count: 1,
                rows: [{ titulo: 'Libro Disponible' }]
            });

            buildPaginationResponse.mockReturnValue({
                data: [{ titulo: 'Libro Disponible' }],
                pagination: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            });

            await getLibros(req, res);

            expect(res.json).toHaveBeenCalled();
        });
    });

    describe('updateLibro', () => {
        it('debe actualizar un libro exitosamente', async () => {
            req.params = { id: '1' };
            req.body = { disponible: false };

            const mockLibro = {
                id: 1,
                titulo: 'Cien años de soledad',
                disponible: true,
                update: jest.fn().mockResolvedValue(true)
            };

            Libro.findOne = jest.fn().mockResolvedValue(mockLibro);

            await updateLibro(req, res);

            expect(mockLibro.update).toHaveBeenCalledWith({ disponible: false });
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    mensaje: 'Libro actualizado exitosamente'
                })
            );
        });

        it('debe fallar si el libro no existe', async () => {
            req.params = { id: '999' };
            req.body = { disponible: false };

            Libro.findOne = jest.fn().mockResolvedValue(null);

            await updateLibro(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'No encontrado'
                })
            );
        });
    });

    describe('deleteLibro', () => {
        it('debe inhabilitar un libro exitosamente', async () => {
            req.params = { id: '1' };

            const mockLibro = {
                id: 1,
                titulo: 'Cien años de soledad',
                activo: true,
                update: jest.fn().mockResolvedValue(true)
            };

            Libro.findOne = jest.fn().mockResolvedValue(mockLibro);

            await deleteLibro(req, res);

            expect(mockLibro.update).toHaveBeenCalledWith({ activo: false, disponible: false });
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    mensaje: 'Libro inhabilitado exitosamente'
                })
            );
        });

        it('debe fallar si el libro no existe', async () => {
            req.params = { id: '999' };

            Libro.findOne = jest.fn().mockResolvedValue(null);

            await deleteLibro(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'No encontrado'
                })
            );
        });
    });
});

