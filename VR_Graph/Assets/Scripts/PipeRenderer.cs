using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PipeRenderer : MonoBehaviour {

    public float pipeRadius;
    public int curveSegmentCount, pipeSegmentCount;

    private Vector3[, ] points;

    private Mesh mesh;
    private List<Vector3> vertices = new List<Vector3> ();
    private List<int> triangles = new List<int> ();

    private void Awake () {
        GetComponent<MeshFilter> ().mesh = new Mesh ();
        mesh = GetComponent<MeshFilter> ().mesh;
        mesh.name = "Pipe";
        SetPoints ();
        SetVertices ();
        SetTriangles ();
        mesh.RecalculateNormals ();
        FlipNormals ();
    }

    private void SetVertices () {

        for (int curveSegmentIndex = 0; curveSegmentIndex < curveSegmentCount - 1; curveSegmentIndex++) {
            for (int pipeSegmentIndex = 0; pipeSegmentIndex < pipeSegmentCount; pipeSegmentIndex++) {
                int nextPipeSegmentIndex = pipeSegmentIndex + 1 >= pipeSegmentCount ? 0 : pipeSegmentIndex + 1;
                // first triangle
                vertices.Add (points[curveSegmentIndex, pipeSegmentIndex]);
                vertices.Add (points[curveSegmentIndex + 1, pipeSegmentIndex]);
                vertices.Add (points[curveSegmentIndex + 1, nextPipeSegmentIndex]);

                // second triangle
                vertices.Add (points[curveSegmentIndex, pipeSegmentIndex]);
                vertices.Add (points[curveSegmentIndex + 1, nextPipeSegmentIndex]);
                vertices.Add (points[curveSegmentIndex, nextPipeSegmentIndex]);
            }
        }

        mesh.vertices = vertices.ToArray ();
    }

    private void SetTriangles () {

        for (int i = 0; i < vertices.Count; i++) {
            triangles.Add (i);
        }

        mesh.triangles = triangles.ToArray ();
    }

    private void SetPoints () {
        points = new Vector3[curveSegmentCount, pipeSegmentCount];

        float stepSize = 10f / curveSegmentCount;
        Vector3 rotation = new Vector3 (0, 0, 0);
        for (int step = 0; step < curveSegmentCount; step++) {
            Vector3 point = GetPointOnHelix (step * stepSize);
            if (step + 1 < curveSegmentCount) {
                Vector3 nextPoint = GetPointOnHelix ((step + 1) * stepSize);
                Vector3 direction = nextPoint - point;
                rotation = Quaternion.LookRotation (direction, new Vector3 (0, 0, 1)).eulerAngles;
            }

            Vector3[] pipePoints = GetCircle (point, pipeRadius, pipeSegmentCount);
            for (int pipeStep = 0; pipeStep < pipePoints.Length; pipeStep++) {
                Vector3 rotatedCirclePoint = RotatePointAroundPivot (pipePoints[pipeStep], rotation, point);
                points[step, pipeStep] = rotatedCirclePoint;
            }
        }
    }

    void FlipNormals () {
        MeshFilter filter = GetComponent (typeof (MeshFilter)) as MeshFilter;
        if (filter != null) {
            Mesh mesh = filter.mesh;

            Vector3[] normals = mesh.normals;
            for (int i = 0; i < normals.Length; i++)
                normals[i] = -normals[i];
            mesh.normals = normals;

            for (int m = 0; m < mesh.subMeshCount; m++) {
                int[] triangles = mesh.GetTriangles (m);
                for (int i = 0; i < triangles.Length; i += 3) {
                    int temp = triangles[i + 0];
                    triangles[i + 0] = triangles[i + 1];
                    triangles[i + 1] = temp;
                }
                mesh.SetTriangles (triangles, m);
            }
        }
    }

    private void OnDrawGizmos () {
        float stepSize = 10f / curveSegmentCount;
        Vector3 rotation = new Vector3 (0, 0, 0);
        for (float step = 0; step < curveSegmentCount; step++) {
            Vector3 point = GetPointOnHelix (step * stepSize);
            Gizmos.color = Color.white;
            if (step + 1 < curveSegmentCount) {
                Vector3 nextPoint = GetPointOnHelix ((step + 1) * stepSize);
                Vector3 direction = nextPoint - point;
                rotation = Quaternion.LookRotation (direction, new Vector3 (0, 0, 1)).eulerAngles;
            }

            Vector3[] pipePoints = GetCircle (point, pipeRadius, pipeSegmentCount);
            foreach (Vector3 circlePoint in pipePoints) {
                Vector3 rotatedCirclePoint = RotatePointAroundPivot (circlePoint, rotation, point);
                Gizmos.color = Color.red;
                Gizmos.DrawSphere (transform.rotation * rotatedCirclePoint + transform.position, 0.05f);
            }
        }
    }

    Vector3 GetPointOnHelix (float t) {
        float x, y, z;
        x = Mathf.Cos (t);
        y = Mathf.Sin (t);
        z = t / 10;
        return new Vector3 (x, y, z);
    }

    Vector3 GetPointOnCircle (float t, Vector3 middlePoint, float radius) {
        float x, y, z;
        x = middlePoint.x + radius * Mathf.Cos (t);
        y = middlePoint.y + radius * Mathf.Sin (t);
        z = middlePoint.z;
        return new Vector3 (x, y, z);
    }

    Vector3[] GetCircle (Vector3 middlePoint, float radius, int segments) {
        List<Vector3> points = new List<Vector3> ();
        float stepSize = 2 * Mathf.PI / segments;
        for (float step = 0; step < segments; step++) {
            Vector3 point = GetPointOnCircle (step * stepSize, middlePoint, radius);
            points.Add (point);
        }
        return points.ToArray ();
    }

    Vector3 RotatePointAroundPivot (Vector3 point, Vector3 angles, Vector3 pivot) {
        Vector3 dir = point - pivot;
        dir = Quaternion.Euler (angles) * dir;
        point = dir + pivot;
        return point;
    }

}