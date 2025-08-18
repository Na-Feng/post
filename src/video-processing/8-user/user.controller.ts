import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserAccountDto,
  UpdateUserAccountDto,
} from '../6-common/dto/user.dto';
import { YoutubeService } from '../4-uploader/youtube.service'; // Import YoutubeService

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly youtubeService: YoutubeService, // Inject YoutubeService
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserAccountDto) {
    return this.userService.addUser(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.getAllUsers();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.getUser(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserAccountDto) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  @Post('google-oauth-callback')
  @HttpCode(HttpStatus.OK)
  async handleGoogleOAuthCallback(
    @Body('code') code: string,
    @Body('douyinSecId') douyinSecId: string,
  ) {
    await this.youtubeService.handleGoogleOAuthCallback(code, douyinSecId);
    return { message: 'Google OAuth callback processed successfully.' };
  }
}
