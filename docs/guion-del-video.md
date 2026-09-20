# El vídeo de la portada

Un vídeo de **60 a 75 segundos** que se pone justo debajo de los dos
botones de la portada. No hay que contratar a nadie ni comprar nada: se
graba con la pantalla del ordenador y tu voz, en una tarde.

La regla, antes de empezar: **que sea casero y concreto**. Un vídeo con
música épica y planos de estadios llenos hunde esto, porque el club que
lo ve sabe que no es él. Uno en el que se ve una pantalla de verdad y
una voz normal explicando lo que hace, funciona. No busques que quede
bonito; busca que quede claro.

---

## 1. Lo que hay que preparar antes

- [ ] **Un club de prueba con datos que parezcan de verdad.** Escudo,
      portada, tres o cuatro equipos, dos o tres oportunidades con su
      precio. Si sale un club a medio rellenar, el vídeo dice "esto
      está a medio hacer".
- [ ] **Nada de fotos de menores.** Ni en la portada, ni en los equipos,
      ni en las galerías. Aunque el club sea de prueba, el vídeo se
      queda en internet. Usa fotos de instalaciones, de material o de
      adultos.
- [ ] **El navegador limpio.** Sin barra de marcadores, sin más
      pestañas, sin extensiones que asomen, sin notificaciones. Zoom al
      100 %.
- [ ] **Una solicitud de contacto ya recibida** en el club de prueba,
      para poder enseñar la pantalla de "quién te escribe" con algo
      dentro.
- [ ] **Silencio.** Teléfono en silencio, ventana cerrada. El ruido de
      fondo se nota mucho más de lo que parece al grabarlo.

---

## 2. Cómo se graba (Windows)

1. Abre **Chrome** en la página por la que vas a empezar.
2. Pulsa **`Windows` + `G`**. Se abre la barra de juego de Windows.
3. En el recuadro de **Capturar**, pulsa el botón redondo de grabar. (El
   atajo directo es **`Windows` + `Alt` + `R`**.)
4. Comprueba que el **micrófono está encendido** — el icono del micro,
   en ese mismo recuadro, no debe tener una raya encima.
5. Habla y ve haciendo lo del guion.
6. Para parar, **`Windows` + `Alt` + `R`** otra vez.
7. El archivo aparece en **`Vídeos\Capturas`**.

> Si la barra de juego no te deja grabar, la alternativa es abrir
> **PowerPoint → Insertar → Grabación de pantalla**, que hace lo mismo y
> también graba la voz.

**No pasa nada si te equivocas a la mitad: para y vuelve a empezar.** Es
más rápido repetir una toma entera que intentar arreglarla después. La
tercera o la cuarta suele ser la buena.

---

## 3. El guion

La columna de la izquierda es lo que se ve; la de la derecha, lo que
dices. Los tiempos son orientativos: si te sale en 80 segundos, bien.

### 0:00 – 0:10 · Por qué existe esto

**En pantalla:** la portada de ApoyaClub, quieta.

> «Si llevas un club de barrio, sabes lo que cuesta conseguir un
> patrocinador. Vas puerta por puerta, cuentas lo mismo veinte veces, y
> a la tercera empresa ya no te acuerdas de a quién habías llamado.
> ApoyaClub es para eso.»

### 0:10 – 0:25 · La página del club

**En pantalla:** entra en la página pública del club de prueba. Baja
despacio: escudo, equipos, instalaciones, números.

> «Lo primero es la página de tu club. Tus equipos, tu cantera, tus
> instalaciones y tus números, en un sitio que puedes mandar por
> WhatsApp. Se rellena una vez y ya la tienes para siempre.»

### 0:25 – 0:42 · Las oportunidades

**En pantalla:** baja hasta las oportunidades. Abre una y enseña la
ficha: qué recibe la empresa, de qué se encarga el club, el precio.

> «Y aquí está lo que de verdad cambia las cosas: tus oportunidades de
> patrocinio. Cada una dice qué recibe la empresa, qué pones tú y cuánto
> cuesta. Desde cincuenta euros hasta el patrocinio principal. Y no todo
> es dinero: si lo que necesitas es un autobús o un fisio, lo pides por
> su nombre.»

### 0:42 – 0:57 · Una empresa escribe

**En pantalla:** el formulario de contacto de la página pública, y
después la pantalla de solicitudes del panel, con la solicitud dentro.

> «La empresa te escribe desde aquí, sin registrarse en nada. A ti te
> llega un correo, y la solicitud entra en tu lista. De un vistazo ves a
> quién tienes pendiente de contestar. Nada se pierde.»

### 0:57 – 1:10 · El dossier y el informe

**En pantalla:** el panel del dossier y, si te da tiempo, un informe.

> «Y cuando cierras un acuerdo, ApoyaClub te va recordando lo que
> prometiste hasta que lo cumples. Al final le mandas a la empresa un
> informe con todo lo que se hizo. Eso es lo que hace que el año
> siguiente te digan que sí otra vez.»

### 1:10 – 1:18 · Cierre

**En pantalla:** vuelta a la portada.

> «Un mes gratis, sin permanencia y sin comisiones. Si tu club tiene
> algo que ofrecer, aquí es donde se enseña.»

---

## 4. Cómo hablar

- **Despacio.** Al grabar siempre se habla más rápido de lo que parece.
- **De usted a nadie.** Háblale a un presidente de club como le
  hablarías en un bar.
- **Sin leer.** Ten el guion al lado y di lo mismo con tus palabras. Se
  nota muchísimo cuando alguien lee.
- **Un silencio no es un fallo.** Si te paras dos segundos entre
  sección y sección, mejor: da tiempo a mirar la pantalla.
- **No digas "como podéis ver".** Di lo que hay.

---

## 5. Cuando lo tengas

Mándame el archivo por el chat. Yo me encargo de:

- comprimirlo para que la portada no tarde en cargar (un vídeo de un
  minuto sin comprimir puede pesar treinta megas, y eso en el móvil de
  alguien con datos es una página que no abre);
- ponerlo en su sitio dentro del proyecto;
- encender la sección, que ya está hecha y esperando.

Del lado del código está todo listo: la sección del vídeo existe y **no
se pinta hasta que haya vídeo**. Es una sola línea en
`src/app/[locale]/components/secciones.tsx`:

```ts
const VIDEO_DEL_PRODUCTO: string | null = null;
```

El día que exista el archivo, ese `null` pasa a ser el nombre del vídeo
y la sección aparece sola en la portada.
