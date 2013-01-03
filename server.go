package main

/*
#cgo LDFLAGS: -lassimp -L/usr/local/lib/libassimp.so
#include <stdio.h>
#include <stdlib.h>
#include <assimp/cimport.h> // Plain-C interface
#include <assimp/scene.h> // Output data structure
#include <assimp/postprocess.h> // Post processing flags
*/
import "C"
import "net/http"
import "os"
import "fmt"
import "encoding/json"
import "./libs/assimp-go/conv"

func handler(w http.ResponseWriter, r *http.Request) {
	values := r.URL.Query()

	gScene, err := conv.LoadAsset("assets/models/" + values.Get("name"))
	if err != nil {
		fmt.Println("error:", err)
	}

	b, err := json.Marshal(gScene)
	if err != nil {
		fmt.Println("error:", err)
	}

	w.Write(b)
}

func main() {
	path, err := os.Getwd()
	if err != nil {
		fmt.Println(err)
	}

	http.Handle("/", http.FileServer(http.Dir(path)))
	http.HandleFunc("/engine/model", handler)
	panic(http.ListenAndServe(":8080", nil))
}
