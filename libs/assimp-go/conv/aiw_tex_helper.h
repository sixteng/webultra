#ifndef _AIW_TEX_HELPER_H
#define _AIW_TEX_HELPER_H

#include <assimp/mesh.h>
#include <assimp/vector3.h>
#include <assimp/types.h>
#include <assimp/scene.h>

// Texture related functions

// Check if the mesh have a texture at the given texture set
int aiw_has_texture_at(struct aiMesh* m, unsigned int tex_set);

// Read the texture information for the mesh at the given position
struct aiVector3D* aiw_read_texture_at(struct aiMesh* m, unsigned int tex_set, unsigned int vertex_idx);

int aiw_has_matrial_at(struct aiMesh* m);

int aiw_get_matrial_at(struct aiScene* m, unsigned int index);

#endif