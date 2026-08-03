import { Transform } from 'class-transformer';

/**
 * Chuẩn hóa mã người dùng nhập tay (mã giảm giá...): bỏ khoảng trắng thừa và
 * viết hoa, để "  giam10 " và "GIAM10" là cùng một mã.
 */
export const NormalizeCode = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  );
