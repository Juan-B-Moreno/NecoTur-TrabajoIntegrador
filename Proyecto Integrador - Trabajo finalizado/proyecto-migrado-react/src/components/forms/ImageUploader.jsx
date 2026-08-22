import { useEffect, useState } from 'react';
import { MAX_IMAGENES } from '../../utils/images';
import { ALLOWED_IMAGE_LABEL, isAllowedImageFile } from '../../utils/imageValidation';

export default function ImageUploader({
  existing = [],
  removed = [],
  onExistingRemove,
  onFilesChange,
  required = true,
}) {
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const kept = existing.filter((url) => !removed.includes(url));
  const total = kept.length + files.length;

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const updateFiles = (next) => {
    setFiles(next);
    onFilesChange?.(next);
  };

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';
    setTouched(true);
    setError('');

    for (const file of selected) {
      if (!isAllowedImageFile(file)) {
        setError(`Extensión no permitida. Use ${ALLOWED_IMAGE_LABEL}.`);
        return;
      }
    }

    const slots = MAX_IMAGENES - kept.length;
    const combined = [...files, ...selected].slice(0, slots);
    if (files.length + selected.length > slots) {
      setError(`Máximo ${MAX_IMAGENES} imágenes por publicación.`);
    }
    updateFiles(combined);
  };

  const removeNewFile = (index) => {
    updateFiles(files.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (required && total < 1) return 'Al menos una imagen es obligatoria.';
    if (total > MAX_IMAGENES) return `Máximo ${MAX_IMAGENES} imágenes por publicación.`;
    return null;
  };

  ImageUploader.validate = validate;

  return (
    <div className="form-group">
      <label className="form-label">
        Imagen{required && <span className="required"> *</span>}
      </label>
      {(kept.length > 0 || files.length > 0) && (
        <div className="editar-imagenes-galeria">
          {kept.map((url) => (
            <div key={url} className="editar-imagen-item">
              <div className="editar-imagen-thumb">
                <img
                  src={url}
                  alt="Imagen de la publicación"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-quitar-imagen"
                onClick={() => onExistingRemove?.(url)}
              >
                Quitar
              </button>
            </div>
          ))}
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="editar-imagen-item">
              <div className="editar-imagen-thumb">
                <img
                  src={previewUrls[index]}
                  alt={file.name}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-quitar-imagen"
                onClick={() => removeNewFile(index)}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="form-file-input">
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFiles}
          disabled={total >= MAX_IMAGENES}
        />
        <span>
          {total >= MAX_IMAGENES
            ? `Máximo de ${MAX_IMAGENES} imágenes alcanzado`
            : `Seleccionar archivos (máx. ${MAX_IMAGENES})`}
        </span>
      </div>
      <p className="form-hint">
        Entre 1 y {MAX_IMAGENES} imágenes ({ALLOWED_IMAGE_LABEL}).
      </p>
      {touched && (error || validate()) && (
        <p className="form-helper" style={{ color: '#EA5A51' }}>{error || validate()}</p>
      )}
    </div>
  );
}
