# 🔌 Guía paso a paso: conectar Firebase y la IA

> Para Douglas. Todo lo que solo puedes hacer tú (requiere tus contraseñas y tu tarjeta).
> Tiempo total estimado: **25–30 minutos**. Al terminar, la IA de GoHappy vuelve a funcionar.

---

## 🎯 Resumen de lo que vas a hacer

| # | Paso | Tiempo | ¿Cuesta dinero? |
|---|---|---|---|
| 1 | Reactivar el plan Blaze de Firebase | 5 min | Céntimos al mes |
| 2 | Verificar que la IA revive | 2 min | — |
| 3 | Generar la clave VAPID (push web) | 5 min | Gratis |
| 4 | Sacar la clave de Ticketmaster (eventos) | 10 min | Gratis |
| 5 | Avisarme para que las pegue y despliegue | — | — |

---

## PASO 1 — Reactivar el plan Blaze ⚡ (lo más importante)

**Esto es lo que tiene la IA muerta desde el 8 de julio.** Sin Blaze, las Cloud Functions no se ejecutan: sin IA, sin referidos y sin retos validados.

1. Entra en **https://console.firebase.google.com**
2. Selecciona el proyecto **`kindr-8d660`** (aparece como *GOHAPPYFAMILY*)
3. Abajo del todo en el menú izquierdo verás el plan actual. Pulsa **"Actualizar"** / **"Upgrade"**
4. Elige el plan **Blaze (pago por uso)**
5. Vincula una cuenta de facturación (te pedirá tarjeta)

### 💰 ¿Cuánto te va a costar de verdad?
Blaze **incluye la misma capa gratuita que Spark**. Solo pagas lo que consumas por encima, y con el tráfico actual de GoHappy eso son **céntimos al mes**.

### 🛡️ Ponte un límite de gasto (hazlo, 2 minutos)
Para dormir tranquilo:
1. En Firebase Console → ⚙️ → **Uso y facturación** → pestaña **Detalles y configuración**
2. Pulsa **"Modificar presupuesto"**
3. Pon un presupuesto de **5 €/mes** con alertas al 50%, 90% y 100%

Así, si algo se dispara, te enteras el mismo día.

---

## PASO 2 — Comprobar que la IA revive

Espera **2-3 minutos** tras activar Blaze y luego:

**Opción fácil:** abre https://douglascyberbraz-beep.github.io/GoHappy-App/ , entra con tu cuenta y ve a la pestaña **Today**. Si el plan del día aparece generado, la IA está viva. ✅

**O simplemente dímelo y lo verifico yo** — tengo el comando preparado y te lo confirmo en 10 segundos.

---

## PASO 3 — Clave VAPID (para las notificaciones push)

Sin esto, la app no puede enviar el recordatorio diario del "Super Plan".

1. En Firebase Console, proyecto `kindr-8d660`
2. ⚙️ (arriba a la izquierda) → **Configuración del proyecto**
3. Pestaña **Cloud Messaging**
4. Baja hasta **"Configuración web"** → **Certificados push web**
5. Pulsa **"Generar par de claves"**
6. Copia la clave larga que aparece (empieza por `B...` y tiene ~87 caracteres)

📋 **Guárdala y pásamela** — yo la pego en `config.js` y despliego.

---

## PASO 4 — Clave de Ticketmaster (eventos reales)

Ahora mismo los eventos los inventa la IA. Con esta clave pasan a ser eventos **reales** de tu zona. Es gratis.

1. Entra en **https://developer-acct.ticketmaster.com/user/register**
2. Regístrate (email + contraseña, sin tarjeta)
3. Confirma el email
4. Una vez dentro → **My Apps** → **Add a new app**
   - Nombre: `GoHappy Family`
   - Descripción: `Family activity discovery app`
5. Copia el valor de **Consumer Key**

📋 **Pásamela también.**

> ⏳ Nota: la clave a veces tarda unos minutos en activarse. Si al probar da error, espera 15 minutos.

---

## PASO 5 — Avísame

Cuando tengas las dos claves, mándamelas y yo me encargo de:
- Pegarlas en `js/config.js`
- Subir la versión en los 5 sitios
- Desplegar
- Verificar que todo funciona
- Regenerar el APK

---

## ❓ Preguntas frecuentes

**¿Es peligroso poner la tarjeta en Firebase?**
Es el mismo Google. Con el límite de gasto del paso 1 tienes el riesgo controlado. Millones de desarrolladores lo usan así.

**¿Puedo publicar la app sin activar Blaze?**
Sí — la app funciona: login, familias, mapa, momentos, retos… todo eso va por la capa gratuita. **Pero sin IA**, que es justo lo que la hace especial. Publicarla sin IA sería vender GoHappy a medias.

**¿Y si me paso del límite?**
Con 5 €/mes de tope y tu tráfico actual, no vas a llegar ni de lejos. Firebase te avisa por email mucho antes.

**¿Estas claves son secretas?**
- **VAPID**: es pública por diseño (va en el código del navegador). Sin problema.
- **Ticketmaster**: es una consumer key de uso público, pero mejor no publicarla por ahí.
- ⚠️ La que **NUNCA** debe salir del servidor es la de Gemini — y esa ya está bien guardada en la Cloud Function, no en el código de la app. Eso ya lo hicimos bien.
