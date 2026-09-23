-- Agrega sucursal_slug a resenas_manuales para poder filtrar el mismo
-- componente Testimonials por sucursal (null = se muestra en la home, con
-- todas mezcladas; con valor = solo en /sucursales/<slug>).
ALTER TABLE resenas_manuales ADD COLUMN IF NOT EXISTS sucursal_slug text;

-- Reseñas reales de Google Maps, curadas (se excluyen reclamos, fotos sin
-- texto y reacciones sueltas) y separadas por sucursal según el slug real
-- de /sucursales/<slug> (casa-central = Villa de Mayo, don-torcuato = la
-- que el dueño llama "Panamericana").
INSERT INTO resenas_manuales (nombre, texto, rating, fecha_texto, sucursal_slug) VALUES
('Brian Ponce', 'Todo fue Excelente. Entregamos una camioneta en parte de pago, y nos subimos a otra que tenían en el hall. Un excelente servicio. Siempre fuimos asesorados en cada paso. Gabriel es un genio! Y junto con Vale nos hicieron vivir una muy buena experiencia de compra. Además de tomar en consideración nuestras formas de pago, resolvieron cada solicitud que les hicimos. Resumen, excelente servicio de venta.', 5, 'Hace 4 meses', 'casa-central'),
('Juan Manuel Della Monica', 'Llevé mi camioneta a vender y me la vendieron en tiempo récord! Tan solo 3 días me pagaron en efectivo y no me bajaron el precio de la camioneta, muy buena atención y dedicación de todos los que trabajan, tanto Gabriel y los vendedores. Lo recomiendo 100%, confiables y cumplidores!', 5, 'Hace 5 meses', 'casa-central'),
('Marina Puma', 'Muy buena atención 👏 Mi experiencia fue excelente. Julian Alles se portó de 10.', 5, 'Hace 2 semanas', 'casa-central'),
('marcos gauto', 'Excelente servicio! Son completamente profesionales en lo que hacen. Nos atendió Julian (sucursal Villa de Mayo), despejó todas las dudas, nos tuvo mucha paciencia y nos dió la tranquilidad que necesitábamos.', 5, 'Hace un año', 'casa-central'),
('ariel barbuto', 'Excelente atención muy recomendables. Los autos uno mejor que el otro. Gracias Esteban por tu atención. Y los dueños de primera.', 5, 'Hace 9 meses', 'casa-central'),
('Matias Leon', 'Mi experiencia fue excelente, son todos super amables y Lucas fue el que nos asesoró en toda la gestión y la verdad que hizo todo lo posible para que tengamos nuestro auto rápido y en perfecto estado.', 5, 'Hace un año', 'casa-central'),
('Jenny Tosar', 'Impecable todo, el vendedor Julián que nos atendió un genio, hizo todo lo posible para que cerremos la operación. Super contentos con nuestro autito. Gracias por todo!!! Y la atención también nos encantó.', 5, 'Hace un año', 'casa-central'),
('Estefania Alvarez', 'La verdad fuimos a varias agencias de autos y deposité mi confianza, y fue una tranquilidad la que me transmitió Julián, que fue nuestro vendedor. Excelente, le hice mil preguntas y fueron todas bien explicadas. La verdad, 100% recomendables 👏', 5, 'Hace un año', 'casa-central'),
('Valeria Nsian', 'La atención fue excelente sumado a la buena predisposición, fue mi primera compra con ellos y supieron entender, despejar mis dudas, generar tranquilidad y confianza. Fue muy rápido. Estamos felices, mil gracias por todo!!', 5, 'Hace 9 meses', 'casa-central'),
('juan cruz', 'Un lujo la atención de minuto 0, conseguí lo que buscaba al mejor precio! Gracias Gabriel y Pfaffen!', 5, 'Hace 10 meses', 'casa-central'),
('Cristian Claros', 'Hace unos días compré mi auto con Julián, un crack, el pibe me explicó todo y resolvió todo muy rápido. La verdad que recomiendo mucho la agencia para comprar autos, todo muy buena onda y respetuosos.', 5, 'Hace un año', 'casa-central'),
('Florencia Astrada', 'Lugar super recomendable, nos demostró ser una agencia seria y confiable. Viajamos desde el interior a buscar nuestro auto, y Lucas se encargó de que todo resultara perfecto. Suele ser muy difícil viajar sin conocer. Pero nuestra experiencia es excelente!', 5, 'Hace un año', 'casa-central'),
('only smyle', 'Excelente atención muy profesionales, gracias por permitir dejar el auto en buenas manos.', 5, 'Hace 3 meses', 'don-torcuato'),
('Alejandro Lozano', 'Muy buena atención en tiempo y forma. Lo que está publicado es lo real, sin vueltas. En el día me llevé la Nissan Frontier con seguro y transferencia. Confiable y eficaz, la tienen bien clara.', 5, 'Hace 7 meses', 'don-torcuato'),
('cristian pacioni', 'Excelente atención de todo el equipo. Aclararon todas mis dudas con mucha paciencia y me acompañaron en cada etapa hasta llevarme el auto ideal. Muy recomendables.', 5, 'Hace un mes', 'don-torcuato'),
('Liliana Beilman', 'A la hora de comprar un auto me cansé de buscar y buscar, hasta que di con la mejor agencia "Pfaffen". Excelentes autos, precio y atención. Recomendada 100%. Gracias por ser una agencia confiable.', 5, 'Hace 7 meses', 'don-torcuato'),
('Luis Müller', 'Fui atendido por Lucas, tiene una excelente disposición para explicar con paciencia, tranquilidad y conocimientos, entre otras cualidades. Realmente quedé muy conforme.', 5, 'Hace 3 meses', 'don-torcuato'),
('Rolando Heredia', 'La verdad, una agencia seria. Me atendió Lucas, un genio. La operación salió súper rápido.', 5, 'Hace 8 meses', 'don-torcuato'),
('Jorge Diego Moreno', 'Excelente atención, todo súper rápido, muy confiables y recomendables 100 x 100.', 5, 'Hace 3 meses', 'don-torcuato'),
('Juan Pablo Guevara', 'Excelente atención, antes de entregarme la camioneta la dejaron más impecable de lo que estaba. Muy amable y atento, Lucas. Cerré la compra y al otro día ya me entregaron la camioneta asegurada y todo. Recomiendo!', 5, 'Hace 9 meses', 'don-torcuato'),
('Abril Olmedo', 'Muy buena atención. Mucha rapidez y facilidad para tramitar la documentación. Nos atendió Lucas!', 5, 'Hace un año', 'don-torcuato'),
('Julian Vacirca', 'Excelente atención de Lucas!! El proceso fue muy claro, limpio y rápido. El auto excelente. Lucas siempre predispuesto a resolver cualquier duda!! Muchas gracias por todo!!', 5, 'Hace 11 meses', 'don-torcuato'),
('Julieta Taborda', 'Muy buena calidad autos, excelente atención de todos, en especial de Lucas quien nos acompañó en todo el proceso. Super felices y recomendamos ampliamente este lugar!', 5, 'Hace un año', 'don-torcuato'),
('Franco Segovia', 'La verdad que fue un lujo. Todo rapidísimo, los autos están impecables y la gestión es rápida. Lucas, que fue el que me acompañó en la semana, me facilitó todos los trámites.', 5, 'Hace un año', 'don-torcuato');
