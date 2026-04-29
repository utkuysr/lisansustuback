import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from "@nestjs/common";
import { ProgramsService } from "./programs.service";
import { CreateProgramDto } from "./dto/create-program.dto";
import { UpdateProgramDto } from "./dto/update-program.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UserRole } from "src/common/constants/roles.constants";

@Controller("programs")
@UseGuards(JwtAuthGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  async create(@Body() createDto: CreateProgramDto, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Sadece admin program oluşturabilir.");
    }
    return this.programsService.create(createDto,req.user);
  }

  @Get()
  async findAll() {
  
    return this.programsService.findAll();
  }

  @Get('my-programs')
  async findMyPrograms(@Request() req) {
    if (req.user.role !== UserRole.KOMISYON_UYESI) {
      throw new ForbiddenException('Bu endpoint sadece komisyon üyelerine özeldir.');
    }
    return this.programsService.findMyPrograms(req.user.sub);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
   
    return this.programsService.findOne(+id);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateProgramDto,
    @Request() req,
  ) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Sadece admin program güncelleyebilir.");
    }
    return this.programsService.update(+id, updateDto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Sadece admin program silebilir.");
    }
    return this.programsService.remove(+id);
  }

  // Admin: program -> commissioners mapping
  @Get(':id/commissioners')
  async listCommissioners(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Sadece admin komisyon üyelerini görüntüleyebilir.');
    }
    return this.programsService.listCommissioners(+id);
  }

  @Put(':id/commissioners')
  async setCommissioners(
    @Param('id') id: string,
    @Body() body: { commissionerIds: number[] },
    @Request() req,
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Sadece admin komisyon üyesi atayabilir.');
    }
    return this.programsService.setCommissioners(+id, body?.commissionerIds ?? []);
  }
}