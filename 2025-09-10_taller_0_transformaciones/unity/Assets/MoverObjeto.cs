using UnityEngine;

public class MoverObjeto : MonoBehaviour
{
    public float rotationSpeed = 50f;   // velocidad de rotación
    public float moveInterval = 2f;     // cada cuántos segundos se mueve
    public float moveDistance = 2f;     // cuánto se traslada en X o Y
    public float scaleAmplitude = 0.5f; // cuánto oscila la escala
    public float scaleBase = 1f;        // escala base del objeto

    private float nextMoveTime;

    void Start()
    {
        nextMoveTime = Time.time + moveInterval;
    }

    void Update()
    {
        // 1. Rotación constante
        transform.Rotate(Vector3.up * rotationSpeed * Time.deltaTime);

        // 2. Traslación aleatoria cada cierto tiempo
        if (Time.time >= nextMoveTime)
        {
            int eje = Random.Range(0, 2); // 0 = X, 1 = Y
            if (eje == 0)
            {
                transform.Translate(Vector3.right * moveDistance);
            }
            else
            {
                transform.Translate(Vector3.up * moveDistance);
            }

            nextMoveTime = Time.time + moveInterval;
        }

        // 3. Escalado oscilante con Mathf.Sin
        float scaleFactor = scaleBase + Mathf.Sin(Time.time) * scaleAmplitude;
        transform.localScale = new Vector3(scaleFactor, scaleFactor, scaleFactor);
    }
}
