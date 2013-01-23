#include "aiw_tex_helper.h"

// Texture related functions

// Check if the mesh have a texture at the given texture set
int aiw_has_texture_at(struct aiMesh* m, unsigned int tex_set)
{
	if (m->mTextureCoords[tex_set] != 0) {
		return 1;
	}
	return 0;
}

// Read the texture information for the mesh at the given position
struct aiVector3D* aiw_read_texture_at(struct aiMesh* m, unsigned int tex_set, unsigned int vertex_idx)
{
	return &(m->mTextureCoords[tex_set][vertex_idx]);
}

// Check if the mesh have a texture at the given texture set
int aiw_has_matrial_at(struct aiMesh* m)
{
	return m->mMaterialIndex;
}

int aiw_get_matrial_at(struct aiScene* s, unsigned int index)
{
	struct aiMaterial * mat = s->mMaterials[index];

	struct aiString path;  // filename

	aiGetMaterialString(mat, AI_MATKEY_TEXTURE(aiTextureType_DIFFUSE, 0), &path);

	return 0;
}