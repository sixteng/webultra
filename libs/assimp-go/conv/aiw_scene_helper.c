#include "aiw_scene_helper.h"

#include <assimp/cimport.h>
#include <assimp/postprocess.h>
#include <stdlib.h>
#include <stdio.h>

// return the mesh on the given index
struct aiMesh* aiw_read_mesh(struct aiScene* s, unsigned int index)
{
	return s->mMeshes[index];
}

// Release all resources used by the scene import
void aiw_release_scene(struct aiScene* s)
{
	// no need to call free(s) after calling aiReleaseImport since inside that code the scene object is already deleted.
	//
	// calling free on s after calling aiReleaseImport generate a double-free error and the program is aborted.
	aiReleaseImport(s);
}

// Load the scene from the given file
const struct aiScene* aiw_import_file(const char* file)
{
	struct aiLogStream c;

	struct aiPropertyStore * prop = aiCreatePropertyStore();
	//aiSetImportPropertyInteger(prop, "PP_PTV_NORMALIZE", 1);

	return aiImportFileExWithProperties(file, aiProcessPreset_TargetRealtime_MaxQuality | aiProcess_PreTransformVertices, NULL, prop);
}